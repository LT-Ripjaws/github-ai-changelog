import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CommitEntity } from './entities/commit.entity';
import { ListCommitsDto } from './dto/list-commits.dto';

@Injectable()
export class CommitsService {
  constructor(
    @InjectRepository(CommitEntity)
    private commitsRepo: Repository<CommitEntity>,
  ) {}

  async findAll(repoId: string, query: ListCommitsDto) {
    const { page = 1, limit = 20, category, from, to } = query;
    const skip = (page - 1) * limit;

    const where: any = { repoId };

    if (category) {
      where.category = category;
    }

    if (from && to) {
      where.committedAt = Between(new Date(from), new Date(to));
    } else if (from) {
      where.committedAt = Between(new Date(from), new Date());
    }

    const [data, total] = await this.commitsRepo.findAndCount({
      where,
      order: { committedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(repoId: string, sha: string): Promise<CommitEntity> {
    const commit = await this.commitsRepo.findOne({ where: { repoId, sha } });
    if (!commit) {
      throw new NotFoundException('Commit not found');
    }
    return commit;
  }
}
