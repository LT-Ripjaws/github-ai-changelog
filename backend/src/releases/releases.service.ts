import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReleaseEntity } from './entities/release.entity';

@Injectable()
export class ReleasesService {
  constructor(
    @InjectRepository(ReleaseEntity)
    private releasesRepo: Repository<ReleaseEntity>,
  ) {}

  async findAll(repoId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await this.releasesRepo.findAndCount({
      where: { repoId },
      order: { releasedAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(repoId: string, id: string): Promise<ReleaseEntity> {
    const release = await this.releasesRepo.findOne({ where: { id, repoId } });
    if (!release) {
      throw new NotFoundException('Release not found');
    }
    return release;
  }

  async findByTagName(repoId: string, tagName: string): Promise<ReleaseEntity> {
    const release = await this.releasesRepo.findOne({ where: { repoId, tagName } });
    if (!release) {
      throw new NotFoundException('Release not found');
    }
    return release;
  }
}
