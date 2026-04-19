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
        removeOnFail: true,
      },
    );
    this.logger.log(`Sync job queued for repo ${repoId}`);
  }

  // Cancel all jobs for a repo (active, waiting, delayed, failed)
  async cancelJobsForRepo(repoId: string): Promise<void> {
    const states = ['active', 'waiting', 'delayed', 'failed'] as const;
    let removed = 0;

    for (const state of states) {
      const jobs = await this.syncQueue.getJobs([state]);
      for (const job of jobs) {
        if (job.data?.repoId === repoId) {
          try {
            await job.remove();
            removed++;
          } catch {
            // Job may have already been removed or completed
          }
        }
      }
    }

    if (removed > 0) {
      this.logger.log(`Cancelled ${removed} job(s) for repo ${repoId}`);
    }
  }
}
