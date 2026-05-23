import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { MetricsService } from './metrics.service';

/**
 * Unauthenticated Prometheus scrape endpoint. Bull queue depth is read at
 * scrape time (pull) so it reflects current state without a polling timer.
 * Must be added to the rate-limiter skip list in main.ts.
 */
@ApiExcludeController()
@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metrics: MetricsService,
    @InjectQueue('repo-sync') private readonly syncQueue: Queue,
  ) {}

  @Get()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  async scrape(): Promise<string> {
    try {
      const counts = await this.syncQueue.getJobCounts();
      for (const [state, value] of Object.entries(counts)) {
        this.metrics.setGauge('sync_queue_jobs', Number(value) || 0, { state });
      }
    } catch {
      // Redis unreachable — still serve in-process counters.
    }
    return this.metrics.render();
  }
}
