import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { RepoEntity, RepoStatus } from './entities/repo.entity';
import { CommitEntity } from '../commits/entities/commit.entity';
import { ReleaseEntity } from '../releases/entities/release.entity';
import { GitHubReleaseResponse, GithubService } from './github.service';
import { AiService } from '../ai/ai.service';
import { UsersService } from '../users/users.service';
import { getErrorMessage } from '../common/errors';
import { RedisPubSubService } from '../common/pubsub/redis-pubsub.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  // Push progress only when SSE transport is enabled (Phase 4). Default off
  // = no extra Redis/DB load, identical to today.
  private readonly pushEnabled = process.env.STATUS_TRANSPORT === 'sse';

  constructor(
    @InjectRepository(RepoEntity) private reposRepo: Repository<RepoEntity>,
    @InjectRepository(CommitEntity) private commitsRepo: Repository<CommitEntity>,
    @InjectRepository(ReleaseEntity) private releasesRepo: Repository<ReleaseEntity>,
    private dataSource: DataSource,
    private githubService: GithubService,
    private aiService: AiService,
    private usersService: UsersService,
    private pubsub: RedisPubSubService,
  ) {}

  // Re-reads the same fields the poll endpoint returns and publishes them so
  // SSE subscribers get live progress. Fail-soft and a no-op unless SSE is on.
  private async publishStatus(repoId: string): Promise<void> {
    if (!this.pushEnabled) return;
    try {
      const repo = await this.reposRepo.findOne({ where: { id: repoId } });
      if (!repo) return;
      await this.pubsub.publish(this.pubsub.channel(repoId), {
        status: repo.status,
        totalCommitsSynced: repo.totalCommitsSynced,
        totalCommitsToSync: repo.totalCommitsToSync,
        errorMessage: repo.errorMessage ?? null,
        lastSyncedAt: repo.lastSyncedAt ?? null,
      });
    } catch (err: unknown) {
      this.logger.warn(`publishStatus failed: ${getErrorMessage(err)}`);
    }
  }

  async syncRepo(repoId: string): Promise<void> {
    const repo = await this.reposRepo.findOne({ where: { id: repoId } });
    if (!repo) throw new Error(`Repo ${repoId} not found`);

    const user = await this.usersService.findById(repo.userId);
    if (!user) throw new Error(`User not found for repo ${repoId}`);

    const token = await this.usersService.getAccessToken(repo.userId);
    const fullName = repo.fullName;
    const [owner, repoName] = fullName.split('/');

    // === STEP 1: Fetch + process commits ===
    // INCREMENTAL_SYNC=on: conditional ETag fetch + `since` + pagination
    // (Phase 3b). Default off = the original single-page, 100-commit fetch.
    this.logger.log(`Fetching commits for ${fullName}`);
    let rawCommits;
    if (process.env.INCREMENTAL_SYNC === 'on') {
      const maxCommits = Number(process.env.MAX_COMMITS_PER_SYNC) || 500;
      const sinceIso = repo.lastSyncedAt
        ? new Date(repo.lastSyncedAt).toISOString()
        : undefined;
      const result = await this.githubService.getCommitsIncremental(
        owner,
        repoName,
        token,
        { sinceIso, etag: repo.commitsEtag, maxCommits },
      );
      if (result.notModified) {
        this.logger.log(`No new commits for ${fullName} (GitHub 304); marking ready`);
        // Preserve lastSyncedAt so the stored ETag stays valid for repeated
        // unchanged re-syncs (keeps hitting 304).
        await this.reposRepo.update(repo.id, { status: RepoStatus.Ready });
        await this.publishStatus(repo.id);
        return;
      }
      rawCommits = result.commits;
      if (result.etag) {
        await this.reposRepo.update(repo.id, { commitsEtag: result.etag });
      }
    } else {
      rawCommits = await this.githubService.getCommits(owner, repoName, token, 100);
    }
    this.logger.log(`Got ${rawCommits.length} commits, processing...`);

    // Track total commits for progress display
    await this.reposRepo.update(repo.id, { totalCommitsToSync: rawCommits.length });
    await this.publishStatus(repo.id);

    const processedShas = new Map<string, string>(); // sha → commit UUID

    for (const rawCommit of rawCommits) {
      const sha = rawCommit.sha;

      // Safety check: stop if repo was deleted mid-sync
      const repoStillExists = await this.reposRepo.findOne({ where: { id: repo.id } });
      if (!repoStillExists) {
        this.logger.warn(`Repo ${fullName} was deleted during sync, stopping.`);
        return;
      }

      // Check if already in DB
      const existing = await this.commitsRepo.findOne({ where: { repoId: repo.id, sha } });

      // Skip if commit exists AND has AI fields populated
      if (existing && existing.aiChangelog && existing.diffSummary) {
        processedShas.set(sha, existing.id);
        continue;
      }

      // Re-process if AI fields are empty
      if (existing) {
        this.logger.log(`Re-processing AI fields for commit ${sha.slice(0, 8)} (previously empty)`);
      }

      let filesChanged = existing?.filesChanged ?? 0;
      let additions = existing?.additions ?? 0;
      let deletions = existing?.deletions ?? 0;
      let diffText = '';

      try {
        const detail = await this.githubService.getCommitDetail(owner, repoName, sha, token);
        if (!existing) {
          filesChanged = detail.files?.length ?? 0;
          additions = detail.stats?.additions ?? 0;
          deletions = detail.stats?.deletions ?? 0;
        }
        diffText = (detail.files ?? [])
          .slice(0, 8)
          .map((file) => `--- ${file.filename}\n${file.patch ?? ''}`)
          .join('\n\n')
          .slice(0, 3500);

        await this.sleep(300); // rate limit buffer between commit detail fetches
      } catch (err: unknown) {
        this.logger.warn(`Could not fetch diff for ${sha}: ${getErrorMessage(err)}`);
      }

      // AI processing (all wrapped in try/catch inside aiService already).
      // AI_COMBINED_ANALYSIS=on collapses the 3 text calls into 1 (Phase 3a);
      // default off = the original 3-call path, byte-for-byte unchanged.
      let diffSummary: string;
      let category: string;
      let aiChangelog: string;
      if (process.env.AI_COMBINED_ANALYSIS === 'on') {
        const analysis = await this.aiService.analyzeCommit(
          rawCommit.commit.message,
          filesChanged,
          diffText,
        );
        diffSummary = diffText ? analysis.diffSummary : (existing?.diffSummary ?? '');
        category = analysis.category;
        aiChangelog = analysis.changelog;
      } else {
        diffSummary = diffText ? await this.aiService.generateDiffSummary(diffText) : (existing?.diffSummary ?? '');
        category = await this.aiService.categorizeCommit(rawCommit.commit.message, diffSummary);
        aiChangelog = await this.aiService.generateChangelog(rawCommit.commit.message, filesChanged, diffSummary);
      }
      const embedding = await this.aiService.generateEmbedding(rawCommit.commit.message + ' ' + diffSummary);

      // Safety check right before DB write cuz repo might have been deleted during AI calls
      const stillExists = await this.reposRepo.findOne({ where: { id: repo.id } });
      if (!stillExists) {
        this.logger.warn(`Repo ${fullName} was deleted during sync, stopping.`);
        return;
      }

      let commit;

      if (existing) {
        // Update existing commit with fresh AI fields
        try {
          await this.commitsRepo.update(existing.id, { diffSummary, aiChangelog, category });
          commit = { ...existing, diffSummary, aiChangelog, category };
        } catch (err: unknown) {
          if (getErrorMessage(err).includes('violates foreign key constraint')) {
            this.logger.warn(`Repo ${fullName} was deleted during sync (FK constraint), stopping.`);
            return;
          }
          throw err;
        }
      } else {
        // Insert new commit
        try {
          commit = await this.commitsRepo.save({
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
        } catch (err: unknown) {
          if (getErrorMessage(err).includes('violates foreign key constraint')) {
            this.logger.warn(`Repo ${fullName} was deleted during sync (FK constraint), stopping.`);
            return;
          }
          throw err;
        }
      }

      processedShas.set(sha, commit.id);

      // Insert/update embedding via raw SQL
      if (embedding.length > 0) {
        const vectorStr = `[${embedding.join(',')}]`;
        await this.dataSource.query(
          `INSERT INTO commit_embeddings (commit_id, embedding)
           VALUES ($1, $2::vector)
           ON CONFLICT (commit_id) DO UPDATE SET embedding = EXCLUDED.embedding`,
          [commit.id, vectorStr]
        );
      }

      // Update sync progress counter (only for new commits)
      if (!existing) {
        await this.reposRepo.increment({ id: repo.id }, 'totalCommitsSynced', 1);
        await this.publishStatus(repo.id);
      }
    }

    // === STEP 2: Fetch + process releases ===
    this.logger.log(`Fetching releases for ${fullName}`);
    let releases: GitHubReleaseResponse[] = [];

    try {
      releases = await this.githubService.getReleases(owner, repoName, token);
    } catch (err: unknown) {
      this.logger.warn(`Could not fetch releases: ${getErrorMessage(err)}`);
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
          const shas = (comparison.commits ?? []).map((commit) => commit.sha);

          for (const sha of shas) {
            const commitId = processedShas.get(sha);
            if (commitId) releaseCommitIds.push(commitId);
          }

          await this.sleep(300); // rate limit buffer between release comparisons
        } catch (err: unknown) {
          this.logger.warn(`Could not compare commits for ${ghRelease.tag_name}: ${getErrorMessage(err)}`);
        }
      }

      // Fetch commit entities for AI summary
      const releaseCommits = releaseCommitIds.length
        ? await this.commitsRepo.findBy({ id: In(releaseCommitIds) })
        : [];

      const aiSummary = await this.aiService.generateReleaseSummary(
        ghRelease.tag_name,
        releaseCommits.map(c => ({ category: c.category, aiChangelog: c.aiChangelog, message: c.message }))
      );

      await this.releasesRepo.manager.transaction(async (txn) => {
        const result = await txn.query(`
          INSERT INTO releases (repo_id, tag_name, release_name, raw_body, ai_summary, breaking_changes, features, fixes, chores, commits_count, released_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id
        `, [
          repo.id,
          ghRelease.tag_name,
          ghRelease.name ?? null,
          ghRelease.body ?? null,
          aiSummary,
          JSON.stringify(releaseCommits.filter(c => c.category === 'breaking').map(c => c.aiChangelog || c.message)),
          JSON.stringify(releaseCommits.filter(c => c.category === 'feature').map(c => c.aiChangelog || c.message)),
          JSON.stringify(releaseCommits.filter(c => c.category === 'fix').map(c => c.aiChangelog || c.message)),
          JSON.stringify(releaseCommits.filter(c => c.category === 'chore').map(c => c.message)),
          releaseCommits.length,
          new Date(ghRelease.published_at),
        ]);
        const id = result[0].id;

        // Link commits to release inside the same transaction
        for (const commitId of releaseCommitIds) {
          await txn.query(
            `INSERT INTO release_commits (release_id, commit_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, commitId]
          );
        }
      });

      await this.sleep(300); // rate limit buffer between release processing
    }

    // === STEP 3: Mark done ===
    const actualCommitCount = await this.commitsRepo.count({ where: { repoId: repo.id } });
    await this.reposRepo.update(repo.id, {
      status: RepoStatus.Ready,
      totalCommitsSynced: actualCommitCount,
      lastSyncedAt: new Date(),
    });
    await this.publishStatus(repo.id);

    this.logger.log(`Sync complete for ${fullName}`);
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
