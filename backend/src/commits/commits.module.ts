import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommitEntity } from './entities/commit.entity';
import { CommitsService } from './commits.service';
import { CommitsController } from './commits.controller';
import { ReposModule } from '../repos/repos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommitEntity]),
    ReposModule,
  ],
  controllers: [CommitsController],
  providers: [CommitsService],
  exports: [CommitsService, TypeOrmModule],
})
export class CommitsModule {}
