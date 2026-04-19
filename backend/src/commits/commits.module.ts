import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommitEntity } from './entities/commit.entity';
import { CommitsService } from './commits.service';
import { CommitsController } from './commits.controller';
import { ReposModule } from '../repos/repos.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommitEntity]),
    ReposModule,
    AiModule,
  ],
  controllers: [CommitsController],
  providers: [CommitsService],
  exports: [CommitsService, TypeOrmModule],
})
export class CommitsModule {}
