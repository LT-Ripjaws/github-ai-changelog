import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AnalyticsService {
  constructor(private dataSource: DataSource) {}

  async getAnalytics(repoId: string, from?: string, to?: string) {
    // Build date filter clause
    const conditions: string[] = ['repo_id = $1'];
    const params: any[] = [repoId];
    let paramIdx = 2;

    if (from) {
      conditions.push(`committed_at >= $${paramIdx}`);
      params.push(from);
      paramIdx++;
    }
    if (to) {
      conditions.push(`committed_at <= $${paramIdx}`);
      params.push(to);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    // Commits by category
    const byCategory = await this.dataSource.query(
      `SELECT category, COUNT(*)::int AS count
       FROM commits
       WHERE ${whereClause}
       GROUP BY category
       ORDER BY count DESC`,
      params,
    );

    const commitsByCategory: Record<string, number> = {
      breaking: 0,
      feature: 0,
      fix: 0,
      chore: 0,
      docs: 0,
      refactor: 0,
    };
    for (const row of byCategory) {
      if (row.category) {
        commitsByCategory[row.category] = row.count;
      }
    }

    // Total commits
    const totalResult = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM commits WHERE ${whereClause}`,
      params,
    );
    const totalCommits = totalResult[0]?.total ?? 0;

    // Commits by month
    const byMonth = await this.dataSource.query(
      `SELECT to_char(committed_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
       FROM commits
       WHERE ${whereClause}
       GROUP BY month
       ORDER BY month ASC`,
      params,
    );

    const commitsByMonth = byMonth.map((row: any) => ({
      month: row.month,
      count: row.count,
    }));

    return {
      totalCommits,
      commitsByCategory,
      commitsByMonth,
    };
  }
}
