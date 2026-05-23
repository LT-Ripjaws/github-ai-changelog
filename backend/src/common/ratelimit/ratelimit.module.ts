import { Global, Module } from '@nestjs/common';
import { RedisRateLimiterService } from './redis-rate-limiter.service';

/** Global so AiService can inject the limiter with no import churn. */
@Global()
@Module({
  providers: [RedisRateLimiterService],
  exports: [RedisRateLimiterService],
})
export class RatelimitModule {}
