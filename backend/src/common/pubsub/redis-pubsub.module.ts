import { Global, Module } from '@nestjs/common';
import { RedisPubSubService } from './redis-pubsub.service';

/** Global so IngestionService, ReposService and the SSE controller can all
 * inject it with no import churn. */
@Global()
@Module({
  providers: [RedisPubSubService],
  exports: [RedisPubSubService],
})
export class RedisPubSubModule {}
