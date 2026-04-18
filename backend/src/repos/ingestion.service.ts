import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RepoEntity } from './entities/repo.entity';
import { CommitEntity } from '../commits/entities/commit.entity';
import { ReleaseEntity } from '../releases/entities/release.entity';
import { ReleaseCommitEntity } from '../releases/entities/release-commit.entity';
import { GithubService } from './github.service';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @InjectRepository(RepoEntity) private reposRepo: Repository<RepoEntity>,
    @InjectRepository(CommitEntity) private commitsRepo: Repository<CommitEntity>,
    @InjectRepository(ReleaseEntity) private releasesRepo: Repository<ReleaseEntity>,
    @InjectRepository(ReleaseCommitEntity) private releaseCommitsRepo: Repository<ReleaseCommitEntity>,
    private dataSource: DataSource,
    private githubService: GithubService,
    private aiService: AiService,
    private usersService: UsersService,
  ) {}

  async syncRepo(repoId: string): Promise<void> {
    const repo = await this.reposRepo.findOne({ where: { id: repoId } });
    if (!repo) throw new Error(`Repo ${repoId} not found`);

    const user = await this.usersService.findById(repo.userId);
    if (!user) throw new Error(`User not found for repo ${repoId}`);

    const token = await this.usersService.getAccessToken(repo.userId);
    const fullName = repo.fullName;
    const [owner, repoName] = fullName.split('/');

    // === STEP 1: Fetch + process commits ===
    this.logger.log(`Fetching commits for ${fullName}`);
    const rawCommits = await this.githubService.getCommits(owner, repoName, token, 100);
    this.logger.log(`Got ${rawCommits.length} commits, processing...`);

    const processedShas = new Map<string, string>(); // sha → commit UUID

    for (const rawCommit of rawCommits) {
      const sha = rawCommit.sha;

      // Skip if already in DB
      const existing = await this.commitsRepo.findOne({ where: { sha } });
      if (existing) {
        processedShas.set(sha, existing.id);
        continue;
      }

      let filesChanged = 0, additions = 0, deletions = 0, diffText = '';

      try {
        const detail = await this.githubService.getCommitDetail(owner, repoName, sha, token);
        filesChanged = detail.files?.length ?? 0;
        additions = detail.stats?.additions ?? 0;
        deletions = detail.stats?.deletions ?? 0;
        diffText = (detail.files ?? [])
          .slice(0, 8)
          .map((f: any) => `--- ${f.filename}\n${f.patch ?? ''}`)
          .join('\n\n')
          .slice(0, 3500);

        await this.sleep(300); // rate limit buffer
      } catch (err: any) {
        this.logger.warn(`Could not fetch diff for ${sha}: ${err.message}`);
      }

      // AI processing (all wrapped in try/catch inside aiService)
      const diffSummary = diffText ? await this.aiService.generateDiffSummary(diffText) : '';
      const category = await this.aiService.categorizeCommit(rawCommit.commit.message, diffSummary);
      const aiChangelog = await this.aiService.generateChangelog(rawCommit.commit.message, filesChanged, diffSummary);
      const embedding = await this.aiService.generateEmbedding(rawCommit.commit.message + ' ' + diffSummary);

      await this.sleep(200); // Gemini rate limit buffer

      // Insert commit
      const commit = await this.commitsRepo.save({
        repoId: repo.id,
        sha,
        message: rawCommit.commit.message,
        authorName: rawCommit.commit.author?.name,
        authorEmail: rawCommit.commit.author?.email,
        authorGithubLogin: rawCommit.author?.login,
        diffSummary,
        aiChangelog,
        category,
        filesChanged,
        additions,
        deletions,
        isMergeCommit: (rawCommit.parents?.length ?? 0) > 1,
        committedAt: new Date(rawCommit.commit.committer?.date ?? rawCommit.commit.author?.date),
      });

      processedShas.set(sha, commit.id);

      // Insert embedding via raw SQL
      if (embedding.length > 0) {
        const vectorStr = `[${embedding.join(',')}]`;
        await this.dataSource.query(
          `INSERT INTO commit_embeddings (commit_id, embedding)
           VALUES ($1, $2::vector)
           ON CONFLICT (commit_id) DO UPDATE SET embedding = EXCLUDED.embedding`,
          [commit.id, vectorStr]
        );
      }

      // Update sync progress counter
      await this.reposRepo.increment({ id: repo.id }, 'totalCommitsSynced', 1);
    }

    // === STEP 2: Fetch + process releases ===
    this.logger.log(`Fetching releases for ${fullName}`);
    let releases: any[] = [];

    try {
      releases = await this.githubService.getReleases(owner, repoName, token);
    } catch (err: any) {
      this.logger.warn(`Could not fetch releases: ${err.message}`);
    }

    for (let i = 0; i < releases.length; i++) {
      const ghRelease = releases[i];

      const exists = await this.releasesRepo.findOne({
        where: { repoId: repo.id, tagName: ghRelease.tag_name }
      });
      if (exists) continue;

      // Find commits for this release by comparing with previous tag
      let releaseCommitIds: string[] = [];

      if (i + 1 < releases.length) {
        try {
          const prevTag = releases[i + 1].tag_name;
          const comparison = await this.githubService.compareCommits(
            owner, repoName, prevTag, ghRelease.tag_name, token
          );
          const shas: string[] = (comparison.commits ?? []).map((c: any) => c.sha);

          for (const sha of shas) {
            const commitId = processedShas.get(sha);
            if (commitId) releaseCommitIds.push(commitId);
          }

          await this.sleep(300);
        } catch (err: any) {
          this.logger.warn(`Could not compare commits for ${ghRelease.tag_name}: ${err.message}`);
        }
      }

      // Fetch commit entities for AI summary
      const releaseCommits = releaseCommitIds.length
        ? await this.commitsRepo.findByIds(releaseCommitIds)
        : [];

      const aiSummary = await this.aiService.generateReleaseSummary(
        ghRelease.tag_name,
        releaseCommits.map(c => ({ category: c.category, aiChangelog: c.aiChangelog, message: c.message }))
      );

      const release = await this.releasesRepo.save({
        repoId: repo.id,
        tagName: ghRelease.tag_name,
        releaseName: ghRelease.name,
        rawBody: ghRelease.body,
        aiSummary,
        breakingChanges: releaseCommits.filter(c => c.category === 'breaking').map(c => c.aiChangelog || c.message),
        features: releaseCommits.filter(c => c.category === 'feature').map(c => c.aiChangelog || c.message),
        fixes: releaseCommits.filter(c => c.category === 'fix').map(c => c.aiChangelog || c.message),
        chores: releaseCommits.filter(c => c.category === 'chore').map(c => c.message),
        commitsCount: releaseCommits.length,
        releasedAt: new Date(ghRelease.published_at),
      });

      // Link commits to release
      for (const commitId of releaseCommitIds) {
        await this.releaseCommitsRepo.save({ releaseId: release.id, commitId });
      }

      await this.sleep(200);
    }

    // === STEP 3: Mark done ===
    await this.reposRepo.update(repo.id, {
      status: 'ready',
      lastSyncedAt: new Date(),
    });

    this.logger.log(`Sync complete for ${fullName}`);
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
