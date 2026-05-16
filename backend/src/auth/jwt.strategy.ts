import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }
    if (secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }

    super({
      jwtFromRequest: (req: CookieRequest) => req?.cookies?.token ?? null,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: { sub: string; username: string }) {
    return { id: payload.sub, username: payload.username };
  }
}
