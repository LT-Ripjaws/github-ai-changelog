import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { IngestionService } from '../repos/ingestion.service';

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
    const { repoId } = job.data;
    this.logger.log(`Starting sync for repo ${repoId}`);

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
