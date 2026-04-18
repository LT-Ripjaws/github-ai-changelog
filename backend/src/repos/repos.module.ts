import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepoEntity } from './entities/repo.entity';
import { CommitEntity } from '../commits/entities/commit.entity';
import { ReleaseEntity } from '../releases/entities/release.entity';
import { ReleaseCommitEntity } from '../releases/entities/release-commit.entity';
import { ReposController } from './repos.controller';
import { ReposService } from './repos.service';
import { GithubService } from './github.service';
import { IngestionService } from './ingestion.service';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RepoEntity, CommitEntity, ReleaseEntity, ReleaseCommitEntity]),
    UsersModule,
    AiModule,
    forwardRef(() => JobsModule),
  ],
  controllers: [ReposController],
  providers: [ReposService, GithubService, IngestionService],
  exports: [ReposService, GithubService, IngestionService],
})
export class ReposModule {}
