import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { IngestionService } from '../repos/ingestion.service';
import { ReposService } from '../repos/repos.service';

interface SyncJobData {
  repoId: string;
  userId: string;
  accessToken: string;
}

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
      await this.reposService.updateStatus(job.data.repoId, 'error', error.message);
    } catch (e: any) {
      this.logger.error(`Failed to update repo status: ${e.message}`);
    }
  }

  @Process('sync')
  async handleSync(job: Job<SyncJobData>) {
    const { repoId } = job.data;
    this.logger.log(`Starting sync for repo ${repoId}`);

    // Update status to 'syncing' before starting
    try {
      await this.reposService.updateStatus(repoId, 'syncing');
    } catch (e: any) {
      this.logger.warn(`Could not update status to syncing: ${e.message}`);
    }

    try {
      await this.ingestionService.syncRepo(repoId);
      this.logger.log(`Sync completed for repo ${repoId}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Sync failed for repo ${repoId}: ${error.message}`);
      throw error;
    }
  }
}
