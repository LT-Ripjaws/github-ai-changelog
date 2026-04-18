import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
  private genAI: GoogleGenerativeAI;
  private flashModel: any;
  private embeddingModel: any;

  constructor(private config: ConfigService) {
    this.genAI = new GoogleGenerativeAI(config.get<string>('GEMINI_API_KEY') ?? '');
    this.flashModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async generateText(prompt: string, maxRetries = 1): Promise<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.flashModel.generateContent(prompt);
        return result.response.text().trim();
      } catch (err: any) {
        if (err.status === 429 && attempt < maxRetries) {
          this.logger.warn('Gemini rate limited, waiting 60s...');
          await this.sleep(60000);
        } else {
          throw err;
        }
      }
    }
    return '';
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text.slice(0, 2000));
      return result.embedding.values;
    } catch (err: any) {
      this.logger.error('Embedding failed:', err.message);
      return [];
    }
  }

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
