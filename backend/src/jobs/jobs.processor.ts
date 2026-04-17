import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ReposService } from '../repos/repos.service';
import { GithubService } from '../repos/github.service';

interface SyncJobData {
  repoId: string;
  userId: string;
  accessToken: string;
}

@Processor('repo-sync')
export class JobsProcessor {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private reposService: ReposService,
    private githubService: GithubService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
  }

  @Process('sync')
  async handleSync(job: Job<SyncJobData>) {
    const { repoId, userId, accessToken } = job.data;
    this.logger.log(`Starting sync for repo ${repoId}`);

    try {
      // Update status to syncing
      await this.reposService.updateStatus(repoId, 'syncing');

      // Get repo info from database
      const repo = await this.reposService.findOne(repoId, userId);
      const [owner, repoName] = repo.fullName.split('/');

      // Fetch commits from GitHub
      this.logger.log(`Fetching commits for ${owner}/${repoName}`);
      const commits = await this.githubService.getCommits(
        owner,
        repoName,
        accessToken,
        100, // Last 100 commits as per plan
      );

      this.logger.log(`Found ${commits.length} commits to process`);

      // Process each commit (placeholder - Week 3 will add AI processing)
      for (const commit of commits) {
        // TODO: Week 3 - Save commit to database and process with AI
        // For now, just increment the count
        await this.reposService.incrementCommitCount(repoId);
        
        // Update job progress
        const progress = Math.round((commits.indexOf(commit) / commits.length) * 100);
        await job.progress(progress);
      }

      // Fetch releases from GitHub
      this.logger.log(`Fetching releases for ${owner}/${repoName}`);
      const releases = await this.githubService.getReleases(
        owner,
        repoName,
        accessToken,
      );

      this.logger.log(`Found ${releases.length} releases to process`);

      // Process each release (placeholder - Week 4 will add AI summaries)
      for (const release of releases) {
        // TODO: - Save release to database and generate AI summary
        this.logger.log(`Release: ${release.tag_name}`);
      }

      // Mark sync as complete
      await this.reposService.updateStatus(repoId, 'ready');
      this.logger.log(`Sync completed for repo ${repoId}`);

      return { processed: commits.length, releases: releases.length };
    } catch (error) {
      this.logger.error(`Sync failed for repo ${repoId}: ${error.message}`);
      await this.reposService.updateStatus(repoId, 'error', error.message);
      throw error;
    }
  }
}
