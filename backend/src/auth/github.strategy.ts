import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService, private usersService: UsersService) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID')!,
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET')!,
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL')!,
      scope: ['user:email', 'repo'],
    });
  }

  async validate(accessToken: string, _refresh: string, profile: any) {
    return this.usersService.upsert({
      githubId: String(profile.id),
      username: profile.username,
      displayName: profile.displayName || profile.username,
      avatarUrl: profile.photos?.[0]?.value,
      email: profile.emails?.[0]?.value,
      accessToken,
    });
  }
}
