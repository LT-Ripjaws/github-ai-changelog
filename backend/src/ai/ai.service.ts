import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import {
  DIFF_SUMMARY_PROMPT,
  CATEGORIZE_PROMPT,
  CHANGELOG_PROMPT,
  RELEASE_SUMMARY_PROMPT,
} from './prompts.constants';

const VALID_CATEGORIES = ['breaking', 'feature', 'fix', 'chore', 'docs', 'refactor'];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  // Kilo Code (OpenAI-compatible) for text generation
  private kilo: OpenAI;
  private kiloModel: string;

  // Gemini for embeddings only
  private embeddingModel: any;

  // Per-provider rate limiters
  private lastKiloCall = 0;
  private lastGeminiCall = 0;
  private readonly kiloMinInterval = 1500;   // ~35 RPM 
  private readonly geminiMinInterval = 800; // ~75 RPM 

  constructor(private config: ConfigService) {
    // Kilo Code gateway for free models, generous rate limits
    this.kilo = new OpenAI({
      baseURL: 'https://api.kilo.ai/api/gateway',
      apiKey: config.get<string>('KILOCODE_API_KEY') ?? '',
    });
    this.kiloModel = config.get<string>('KILOCODE_MODEL') ?? 'kilo-auto/free';

    // Gemini for embeddings only
    const genAI = new GoogleGenerativeAI(config.get<string>('GEMINI_API_KEY') ?? '');
    this.embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Throttle for Kilo Code text gen calls to avoid hitting rate limits
  private async throttleKilo() {
    const elapsed = Date.now() - this.lastKiloCall;
    if (elapsed < this.kiloMinInterval) {
      await this.sleep(this.kiloMinInterval - elapsed);
    }
    this.lastKiloCall = Date.now();
  }

  // Throttle for Gemini embedding calls 
  private async throttleGemini() {
    const elapsed = Date.now() - this.lastGeminiCall;
    if (elapsed < this.geminiMinInterval) {
      await this.sleep(this.geminiMinInterval - elapsed);
    }
    this.lastGeminiCall = Date.now();
  }

  // Extract retry delay from 429 error 
  private getRetryDelay(err: any): number {
    const match = err?.message?.match(/retry in (\d+\.?\d*)s/i);
    if (match) return Math.ceil(parseFloat(match[1]) * 1000);
    return 15000;
  }

  // -- Text generation via Kilo Code --

  private async generateText(prompt: string, maxRetries = 3): Promise<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.throttleKilo();
        const result = await this.kilo.chat.completions.create({
          model: this.kiloModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        });
        return (result.choices[0]?.message?.content ?? '').trim();
      } catch (err: any) {
        const isRateLimit = err.status === 429 || err.status === 503;
        if (isRateLimit && attempt < maxRetries) {
          const delay = this.getRetryDelay(err) * (attempt + 1);
          this.logger.warn(`Kilo rate limited (${err.status}), waiting ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
          await this.sleep(delay);
        } else {
          throw err;
        }
      }
    }
    return '';
  }

  // -- Embeddings via Gemini --

  async generateEmbedding(text: string): Promise<number[]> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.throttleGemini();
        const result = await this.embeddingModel.embedContent(text.slice(0, 2000));
        return result.embedding.values;
      } catch (err: any) {
        if (err.status === 429 && attempt < 2) {
          const delay = this.getRetryDelay(err) * (attempt + 1);
          this.logger.warn(`Gemini embedding rate limited, waiting ${delay / 1000}s...`);
          await this.sleep(delay);
        } else {
          this.logger.error('Embedding failed:', err.message);
          return [];
        }
      }
    }
    return [];
  }

  //  Public API 

  async generateDiffSummary(diff: string): Promise<string> {
    try {
      const prompt = DIFF_SUMMARY_PROMPT.replace('{diff}', diff.slice(0, 3000));
      return await this.generateText(prompt);
    } catch (err: any) {
      this.logger.error('Diff summary failed:', err.message);
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
    } catch (err: any) {
      this.logger.error('Categorization failed:', err.message);
      return 'chore';
    }
  }

  async generateChangelog(message: string, filesChanged: number, diffSummary: string): Promise<string> {
    try {
      const prompt = CHANGELOG_PROMPT
        .replace('{message}', message)
        .replace('{filesChanged}', String(filesChanged))
        .replace('{diffSummary}', diffSummary || message);
      return await this.generateText(prompt);
    } catch (err: any) {
      this.logger.error('Changelog generation failed:', err.message);
      return message;
    }
  }

  async generateReleaseSummary(
    tagName: string,
    commits: { category: string; aiChangelog: string; message: string }[]
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
    } catch (err: any) {
      this.logger.error('Release summary failed:', err.message);
      return `Release ${tagName} contains ${commits.length} commits.`;
    }
  }
}
