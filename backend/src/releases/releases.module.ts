import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseEntity } from './entities/release.entity';
import { ReleaseCommitEntity } from './entities/release-commit.entity';
import { ReleasesService } from './releases.service';
import { ReleasesController } from './releases.controller';
import { ReposModule } from '../repos/repos.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReleaseEntity, ReleaseCommitEntity]), ReposModule],
  controllers: [ReleasesController],
  providers: [ReleasesService],
  exports: [ReleasesService, TypeOrmModule],
})
export class ReleasesModule {}
