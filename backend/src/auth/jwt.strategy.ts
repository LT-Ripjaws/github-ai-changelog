import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: import('@nestjs/config').ConfigService) {
    super({
      jwtFromRequest: (req: any) => {
        // Try Bearer token first (backward compat with localStorage)
        const bearerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (bearerToken) return bearerToken;
        // Fall back to httpOnly cookie
        return req?.cookies?.token ?? null;
      },
      secretOrKey: config.get<string>('JWT_SECRET')!,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: { sub: string; username: string }) {
    return { id: payload.sub, username: payload.username };
  }
}
