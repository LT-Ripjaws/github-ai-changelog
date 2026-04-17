import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsService } from './jobs.service';
import { JobsProcessor } from './jobs.processor';
import { ReposModule } from '../repos/repos.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'repo-sync',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: { count: 50 },
      },
    }),
    forwardRef(() => ReposModule),
    
  
  ],
  providers: [JobsService, JobsProcessor],
  exports: [JobsService],
})
export class JobsModule {}
