import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
  ) {}

  async findByGithubId(githubId: string): Promise<UserEntity | null> {
    return this.usersRepo.findOne({ where: { githubId } });
  }

  async upsert(data: {
    githubId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    email: string;
    accessToken: string;
  }): Promise<UserEntity> {
    const existing = await this.findByGithubId(data.githubId);

    if (existing) {
      await this.usersRepo.update(existing.id, {
        accessToken: data.accessToken,
        username: data.username,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        email: data.email,
      });
      return this.usersRepo.findOneOrFail({ where: { githubId: data.githubId } });
    }

    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepo.findOne({ where: { id } });
  }
}
