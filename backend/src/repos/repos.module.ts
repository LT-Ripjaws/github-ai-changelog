import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepoEntity } from './entities/repo.entity';
import { ReposController } from './repos.controller';
import { ReposService } from './repos.service';
import { GithubService } from './github.service';
import { UsersModule } from '../users/users.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RepoEntity]),
    UsersModule, forwardRef(() => JobsModule)
  ],
  controllers: [ReposController],
  providers: [ReposService, GithubService],
  exports: [ReposService, GithubService],
})
export class ReposModule {}
