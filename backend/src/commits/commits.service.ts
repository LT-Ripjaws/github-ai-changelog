import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { CommitEntity } from './entities/commit.entity';
import { ListCommitsDto } from './dto/list-commits.dto';
import { AiService } from '../ai/ai.service';

interface SemanticSearchRow {
  id: string;
  sha: string;
  message: string;
  author_name: string | null;
  author_github_login: string | null;
  diff_summary: string | null;
  ai_changelog: string | null;
  category: string | null;
  files_changed: number;
  additions: number;
  deletions: number;
  committed_at: string;
  similarity: string | number;
}

@Injectable()
export class CommitsService {
  constructor(
    @InjectRepository(CommitEntity)
    private commitsRepo: Repository<CommitEntity>,
    private dataSource: DataSource,
    private aiService: AiService,
  ) {}

  async findAll(repoId: string, query: ListCommitsDto) {
    const { page = 1, limit = 20, category, from, to } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<CommitEntity> = { repoId };

    if (category) {
      where.category = category;
    }

    if (from && to) {
      where.committedAt = Between(new Date(from), new Date(to));
    } else if (from) {
      where.committedAt = MoreThanOrEqual(new Date(from));
    } else if (to) {
      where.committedAt = LessThanOrEqual(new Date(to));
    }

    const [data, total] = await this.commitsRepo.findAndCount({
      where,
      order: { committedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(repoId: string, sha: string): Promise<CommitEntity> {
    const commit = await this.commitsRepo.findOne({ where: { repoId, sha } });
    if (!commit) {
      throw new NotFoundException('Commit not found');
    }
    return commit;
  }

  async semanticSearch(repoId: string, query: string, limit: number = 10) {
    // Embed the query using Gemini
    const embedding = await this.aiService.generateEmbedding(query);
    if (!embedding.length) {
      return { results: [], message: 'Embedding generation failed' };
    }

    const vectorStr = `[${embedding.join(',')}]`;

    // pgvector cosine similarity: <=> operator returns distance (0 = identical, 2 = opposite)
    // So similarity = 1 - distance
    const rows = await this.dataSource.query<SemanticSearchRow[]>(
      `SELECT
        c.id, c.sha, c.message, c.author_name, c.author_github_login,
        c.diff_summary, c.ai_changelog, c.category,
        c.files_changed, c.additions, c.deletions, c.committed_at,
        1 - (ce.embedding <=> $1::vector) AS similarity
       FROM commit_embeddings ce
       JOIN commits c ON c.id = ce.commit_id
       WHERE c.repo_id = $2
         AND ce.embedding IS NOT NULL
       ORDER BY ce.embedding <=> $1::vector
       LIMIT $3`,
      [vectorStr, repoId, limit],
    );

    return {
      results: rows.map((row) => ({
        id: row.id,
        sha: row.sha,
        message: row.message,
        authorName: row.author_name,
        authorGithubLogin: row.author_github_login,
        diffSummary: row.diff_summary,
        aiChangelog: row.ai_changelog,
        category: row.category,
        filesChanged: row.files_changed,
        additions: row.additions,
        deletions: row.deletions,
        committedAt: row.committed_at,
        similarity: parseFloat(Number(row.similarity).toFixed(4)),
      })),
    };
  }
}
