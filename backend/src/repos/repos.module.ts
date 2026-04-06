import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RepoEntity } from './entities/repo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RepoEntity])],
  exports: [],
})
export class ReposModule {}
