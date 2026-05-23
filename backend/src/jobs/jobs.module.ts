import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { JobsProcessor } from './jobs.processor';
import { JobsService } from './jobs.service';
import { ReposModule } from '../repos/repos.module';

// ROLE: 'web' | 'worker' | 'all'. Default 'all' = today's monolith (web
// process also processes jobs). 'web' skips the processor (API only, still
// enqueues via JobsService); 'worker' runs the processor without HTTP.
const role = process.env.ROLE ?? 'all';
const runsProcessor = role !== 'web';

// Coarse global cap on job processing rate, opt-in via env. Unset (default)
// = no limiter = today's behavior. Complements the per-provider AI limiter.
const syncRateMax = Number(process.env.SYNC_RATE_MAX) || 0;
const syncRateDuration = Number(process.env.SYNC_RATE_DURATION_MS) || 1000;

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'repo-sync',
      ...(syncRateMax > 0
        ? { limiter: { max: syncRateMax, duration: syncRateDuration } }
        : {}),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { count: 50 },
      },
    }),
    forwardRef(() => ReposModule),
  ],
  providers: runsProcessor ? [JobsService, JobsProcessor] : [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
