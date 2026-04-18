import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseEntity } from './entities/release.entity';
import { ReleaseCommitEntity } from './entities/release-commit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ReleaseEntity, ReleaseCommitEntity])],
  exports: [TypeOrmModule],
})
export class ReleasesModule {}
