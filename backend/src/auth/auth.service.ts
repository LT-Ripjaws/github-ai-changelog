import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(user: UserEntity): Promise<string> {
    return this.jwtService.sign({ sub: user.id, username: user.username });
  }
}
