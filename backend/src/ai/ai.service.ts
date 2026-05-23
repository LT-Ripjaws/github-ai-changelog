import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { MetricsService } from '../common/metrics/metrics.service';
import { RedisRateLimiterService } from '../common/ratelimit/redis-rate-limiter.service';
import {
  DIFF_SUMMARY_PROMPT,
  CATEGORIZE_PROMPT,
  CHANGELOG_PROMPT,
  RELEASE_SUMMARY_PROMPT,
  ANALYZE_COMMIT_PROMPT,
} from './prompts.constants';

export interface CommitAnalysis {
  diffSummary: string;
  category: string;
  changelog: string;
}

const VALID_CATEGORIES = ['breaking', 'feature', 'fix', 'chore', 'docs', 'refactor'];

interface ProviderError {
  status?: number;
  message: string;
}

function getProviderError(error: unknown): ProviderError {
  if (error instanceof Error) {
    const maybeStatus = (error as Error & { status?: unknown }).status;
    return {
      status: typeof maybeStatus === 'number' ? maybeStatus : undefined,
      message: error.message,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { status?: unknown; message?: unknown };
    return {
      status: typeof maybeError.status === 'number' ? maybeError.status : undefined,
      message: typeof maybeError.message === 'string' ? maybeError.message : 'Unknown provider error',
    };
  }

  return { message: String(error) };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Kilo Code (OpenAI-compatible) for text generation
  private kilo: OpenAI;
  private kiloModel: string;

  // Gemini for embeddings only
  private embeddingModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  // Per-provider rate limiters. Intervals are env-configurable; defaults match
  // the original in-memory values so behavior is unchanged out of the box.
  private lastKiloCall = 0;
  private lastGeminiCall = 0;
  private readonly kiloMinInterval: number;
  private readonly geminiMinInterval: number;
  // 'memory' (default, single-process) | 'redis' (distributed, multi-process)
  private readonly rateLimiterMode: string;

  constructor(
    private config: ConfigService,
    private readonly metrics: MetricsService,
    private readonly rateLimiter: RedisRateLimiterService,
  ) {
    const kiloKey = config.get<string>('KILOCODE_API_KEY');
    if (!kiloKey) throw new Error('KILOCODE_API_KEY is required');
    const geminiKey = config.get<string>('GEMINI_API_KEY');
    if (!geminiKey) throw new Error('GEMINI_API_KEY is required');

    this.kiloMinInterval = Number(config.get('KILO_MIN_INTERVAL_MS')) || 400; // ~150 RPM
    this.geminiMinInterval = Number(config.get('GEMINI_MIN_INTERVAL_MS')) || 800; // ~75 RPM
    this.rateLimiterMode = config.get<string>('RATE_LIMITER') ?? 'memory';

    // Kilo Code gateway for free models, generous rate limits
    this.kilo = new OpenAI({
      baseURL: 'https://api.kilo.ai/api/gateway',
      apiKey: kiloKey,
    });
    this.kiloModel = config.get<string>('KILOCODE_MODEL') ?? 'kilo-auto/free';

    // Gemini for embeddings only
    const genAI = new GoogleGenerativeAI(geminiKey);
    this.embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async throttleKilo() {
    if (this.rateLimiterMode === 'redis') {
      await this.rateLimiter.throttle('ratelimit:kilo', this.kiloMinInterval);
      return;
    }
    const elapsed = Date.now() - this.lastKiloCall;
    if (elapsed < this.kiloMinInterval) {
      await this.sleep(this.kiloMinInterval - elapsed);
    }
    this.lastKiloCall = Date.now();
  }

  private async throttleGemini() {
    if (this.rateLimiterMode === 'redis') {
      await this.rateLimiter.throttle('ratelimit:gemini', this.geminiMinInterval);
      return;
    }
    const elapsed = Date.now() - this.lastGeminiCall;
    if (elapsed < this.geminiMinInterval) {
      await this.sleep(this.geminiMinInterval - elapsed);
    }
    this.lastGeminiCall = Date.now();
  }

  private getRetryDelay(error: unknown): number {
    const message = getProviderError(error).message;
    const match = message.match(/retry in (\d+\.?\d*)s/i);
    return match ? Math.ceil(parseFloat(match[1]) * 1000) : 15000;
  }

  private async generateText(prompt: string, maxAttempts = 5, maxTokens = 500): Promise<string> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.throttleKilo();
        const result = await this.kilo.chat.completions.create({
          model: this.kiloModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
        });
        this.metrics.incCounter('ai_calls_total', { provider: 'kilo', outcome: 'success' });
        // Some models (reasoning models) put output in `reasoning` instead of `content`
        const msg = result.choices[0]?.message as unknown as Record<string, unknown> | undefined;
        const text = ((msg?.content ?? msg?.reasoning ?? '') as string).trim();
        if (!text && attempt < maxAttempts - 1) {
          const delay = 3000 * (attempt + 1);
          this.logger.warn(
            `Kilo returned empty response, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxAttempts})...`,
          );
          await this.sleep(delay);
          continue;
        }
        return text;
      } catch (err: unknown) {
        this.metrics.incCounter('ai_calls_total', { provider: 'kilo', outcome: 'error' });
        const providerError = getProviderError(err);
        const isRetryable =
          providerError.status === 429 ||
          providerError.status === 500 ||
          providerError.status === 502 ||
          providerError.status === 503;
        if (isRetryable && attempt < maxAttempts - 1) {
          const delay = this.getRetryDelay(err) * (attempt + 1);
          this.logger.warn(
            `Kilo error (${providerError.status}), waiting ${delay / 1000}s (attempt ${attempt + 1}/${maxAttempts})...`,
          );
          await this.sleep(delay);
        } else {
          throw err;
        }
      }
    }
    return '';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.throttleGemini();
        const result = await this.embeddingModel.embedContent(text.slice(0, 2000));
        this.metrics.incCounter('ai_calls_total', { provider: 'gemini', outcome: 'success' });
        return result.embedding.values;
      } catch (err: unknown) {
        this.metrics.incCounter('ai_calls_total', { provider: 'gemini', outcome: 'error' });
        const providerError = getProviderError(err);
        if (providerError.status === 429 && attempt < 2) {
          const delay = this.getRetryDelay(err) * (attempt + 1);
          this.logger.warn(`Gemini embedding rate limited, waiting ${delay / 1000}s...`);
          await this.sleep(delay);
        } else {
          this.logger.error('Embedding failed:', providerError.message);
          return [];
        }
      }
    }
    return [];
  }

  async generateDiffSummary(diff: string): Promise<string> {
    try {
      const prompt = DIFF_SUMMARY_PROMPT.replace('{diff}', diff.slice(0, 3000));
      return await this.generateText(prompt);
    } catch (err: unknown) {
      this.logger.error('Diff summary failed:', getProviderError(err).message);
      return '';
    }
  }

  async categorizeCommit(message: string, diffSummary: string): Promise<string> {
    try {
      const prompt = CATEGORIZE_PROMPT
        .replace('{message}', message)
        .replace('{diffSummary}', diffSummary);
      const result = (await this.generateText(prompt)).toLowerCase();
      return VALID_CATEGORIES.includes(result) ? result : 'chore';
    } catch (err: unknown) {
      this.logger.error('Categorization failed:', getProviderError(err).message);
      return 'chore';
    }
  }

  async generateChangelog(message: string, filesChanged: number, diffSummary: string): Promise<string> {
    try {
      const prompt = CHANGELOG_PROMPT
        .replace('{message}', message)
        .replace('{filesChanged}', String(filesChanged))
        .replace('{diffSummary}', diffSummary || message);
      const result = await this.generateText(prompt);
      return result || message; // fall back to raw commit message if AI returns empty
    } catch (err: unknown) {
      this.logger.error('Changelog generation failed:', getProviderError(err).message);
      return message;
    }
  }

  /**
   * Phase 3a: one structured-JSON call for diff summary + category +
   * changelog. On parse/empty failure it falls back to the three
   * single-purpose calls, so the result is never worse than today.
   */
  async analyzeCommit(
    message: string,
    filesChanged: number,
    diffText: string,
  ): Promise<CommitAnalysis> {
    try {
      const prompt = ANALYZE_COMMIT_PROMPT
        .replace('{message}', message)
        .replace('{filesChanged}', String(filesChanged))
        .replace('{diff}', (diffText || '').slice(0, 3000));
      // Larger token budget than the single-purpose calls: the combined JSON
      // (3 fields) plus any reasoning-model preamble overflows the default 500
      // and truncates into invalid JSON, forcing the fallback every time.
      const parsed = this.parseAnalysis(await this.generateText(prompt, 5, 1000));
      if (parsed) {
        const category =
          typeof parsed.category === 'string' &&
          VALID_CATEGORIES.includes(parsed.category.toLowerCase())
            ? parsed.category.toLowerCase()
            : 'chore';
        return {
          diffSummary: typeof parsed.diffSummary === 'string' ? parsed.diffSummary : '',
          category,
          changelog:
            typeof parsed.changelog === 'string' && parsed.changelog.trim()
              ? parsed.changelog
              : message,
        };
      }
      this.logger.warn('analyzeCommit: unparseable JSON, using per-field fallback');
    } catch (err: unknown) {
      this.logger.warn(`analyzeCommit failed, using per-field fallback: ${getProviderError(err).message}`);
    }

    // Per-field fallback === the pre-Phase-3a path (never worse than today).
    const diffSummary = diffText ? await this.generateDiffSummary(diffText) : '';
    const category = await this.categorizeCommit(message, diffSummary);
    const changelog = await this.generateChangelog(message, filesChanged, diffSummary);
    return { diffSummary, category, changelog };
  }

  /**
   * Tolerant JSON extraction for the combined-analysis response. Reasoning
   * models wrap the object in ```fences```, chain-of-thought prose, or stray
   * braces, so a naive first-{ to last-} match fails. Strip fences, then scan
   * for every string/escape-aware balanced {...} block and return the first
   * that parses and carries an expected key.
   */
  private parseAnalysis(raw: string): Partial<CommitAnalysis> | null {
    if (!raw) return null;
    const text = raw.replace(/```(?:json)?/gi, '').trim();

    const candidates: string[] = [];
    let depth = 0;
    let start = -1;
    let inStr = false;
    let esc = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && start >= 0) {
          candidates.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
    candidates.push(text); // last resort: the whole cleaned string

    for (const cand of candidates) {
      try {
        const obj = JSON.parse(cand);
        if (
          obj &&
          typeof obj === 'object' &&
          !Array.isArray(obj) &&
          ('diffSummary' in obj || 'category' in obj || 'changelog' in obj)
        ) {
          return obj;
        }
      } catch {
        // try the next candidate
      }
    }
    return null;
  }

  async generateReleaseSummary(
    tagName: string,
    commits: { category: string; aiChangelog: string; message: string }[],
  ): Promise<string> {
    try {
      const breaking = commits.filter(c => c.category === 'breaking').map(c => c.aiChangelog || c.message).join(', ') || 'none';
      const features = commits.filter(c => c.category === 'feature').map(c => c.aiChangelog || c.message).join(', ') || 'none';
      const fixes = commits.filter(c => c.category === 'fix').map(c => c.aiChangelog || c.message).join(', ') || 'none';
      const chores = commits.filter(c => c.category === 'chore').map(c => c.message).join(', ') || 'none';

      const prompt = RELEASE_SUMMARY_PROMPT
        .replace('{tagName}', tagName)
        .replace('{totalCommits}', String(commits.length))
        .replace('{breaking}', breaking.slice(0, 500))
        .replace('{features}', features.slice(0, 500))
        .replace('{fixes}', fixes.slice(0, 500))
        .replace('{chores}', chores.slice(0, 300));

      return await this.generateText(prompt);
    } catch (err: unknown) {
      this.logger.error('Release summary failed:', getProviderError(err).message);
      return `Release ${tagName} contains ${commits.length} commits.`;
    }
  }
}
