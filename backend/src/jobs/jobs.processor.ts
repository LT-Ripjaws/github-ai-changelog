import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { IngestionService } from '../repos/ingestion.service';
import { ReposService } from '../repos/repos.service';
import { RepoStatus } from '../repos/entities/repo.entity';
import { getErrorMessage } from '../common/errors';

interface SyncJobData {
  repoId: string;
}

// Default 1 = today's behavior (one repo syncs at a time). Raising this is
// only safe once rate limiting is distributed (Phase 2).
const SYNC_CONCURRENCY = Number(process.env.SYNC_CONCURRENCY) || 1;

@Processor('repo-sync')
export class JobsProcessor {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private ingestionService: IngestionService,
    private reposService: ReposService,
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
  async onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
    // Update repo status to 'error' so it doesn't stay stuck on 'pending'
    try {
      await this.reposService.updateStatus(job.data.repoId, RepoStatus.Error, error.message);
    } catch (e: unknown) {
      this.logger.error(`Failed to update repo status: ${getErrorMessage(e)}`);
    }
  }

  @Process({ name: 'sync', concurrency: SYNC_CONCURRENCY })
  async handleSync(job: Job<SyncJobData>) {
    const { repoId } = job.data;
    this.logger.log(`Starting sync for repo ${repoId}`);

    // Update status to 'syncing' before starting
    try {
      await this.reposService.updateStatus(repoId, RepoStatus.Syncing);
    } catch (e: unknown) {
      this.logger.warn(`Could not update status to syncing: ${getErrorMessage(e)}`);
    }

    try {
      await this.ingestionService.syncRepo(repoId);
      this.logger.log(`Sync completed for repo ${repoId}`);
      return { success: true };
    } catch (error: unknown) {
      this.logger.error(`Sync failed for repo ${repoId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}
