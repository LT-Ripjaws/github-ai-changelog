import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService, private usersService: UsersService) {
    // @ts-expect-error @types/passport-github2 is outdated — passport-oauth2 supports state: boolean
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID')!,
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET')!,
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL')!,
      // `repo` grants read+write to all private repos though the app only reads.
      // Classic OAuth has no read-only private scope; accepted risk. A GitHub
      // App or fine-grained token is the principled fix if private repos matter;
      // drop to `public_repo` if private-repo support is not required.
      scope: ['user:email', 'repo'],
      state: true,
    });
  }

  async validate(accessToken: string, _refresh: string, profile: Profile) {
    return this.usersService.upsert({
      githubId: String(profile.id),
      username: profile.username ?? '',
      displayName: profile.displayName ?? profile.username ?? '',
      avatarUrl: profile.photos?.[0]?.value ?? '',
      email: profile.emails?.[0]?.value ?? '',
      accessToken,
    });
  }
}
