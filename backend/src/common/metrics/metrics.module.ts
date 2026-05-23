import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

/**
 * Global so MetricsService can be injected anywhere (GithubService, AiService)
 * with no import churn. Re-registers the 'repo-sync' queue (shares the same
 * underlying Bull queue) so the controller can read queue depth at scrape time.
 */
@Global()
@Module({
  imports: [BullModule.registerQueue({ name: 'repo-sync' })],
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
