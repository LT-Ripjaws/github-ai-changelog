import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(@InjectQueue('repo-sync') private syncQueue: Queue) {}


   // Add a repo sync job to the queue
  
  async addSyncJob(
    repoId: string,
    userId: string,
    accessToken: string,
  ): Promise<void> {
    await this.syncQueue.add(
      'sync',
      { repoId, userId, accessToken },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.log(`Sync job queued for repo ${repoId}`);
  }
}
