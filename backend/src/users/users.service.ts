import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { encrypt, decrypt } from '../common/crypto.util';

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
    const encryptedToken = encrypt(data.accessToken);
    const existing = await this.findByGithubId(data.githubId);

    if (existing) {
      await this.usersRepo.update(existing.id, {
        accessToken: encryptedToken,
        username: data.username,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        email: data.email,
      });
      return this.usersRepo.findOneOrFail({ where: { githubId: data.githubId } });
    }

    const user = this.usersRepo.create({ ...data, accessToken: encryptedToken });
    return this.usersRepo.save(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  /** Returns the decrypted GitHub access token for API calls */
  async getAccessToken(userId: string): Promise<string> {
    const user = await this.findById(userId);
    if (!user?.accessToken) {
      throw new Error('User access token not found');
    }
    return decrypt(user.accessToken);
  }
}
