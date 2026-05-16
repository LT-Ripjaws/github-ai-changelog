import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

// Methods that mutate server state — require CSRF protection
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Origin/Referer-allowlist CSRF protection for cookie-based auth.
 *
 * The auth cookie is SameSite=lax, which already blocks it from being sent on
 * cross-site mutating requests; this is the defense-in-depth layer on top.
 *
 * A double-submit token was removed deliberately: the SPA (different origin
 * from the API) cannot read an API-domain cookie via `document.cookie`, so the
 * token could never be echoed and every write 403'd. Origin/Referer validation
 * is the correct, working protection for a split SPA + API.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  private readonly allowedOrigin: string;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('FRONTEND_URL');
    if (!url) {
      throw new Error('FRONTEND_URL is required for CSRF protection');
    }
    this.allowedOrigin = new URL(url).origin;
  }

  use(req: Request, res: Response, next: NextFunction) {
    if (!MUTATING_METHODS.has(req.method)) {
      return next();
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Browsers always send Origin on cross-site mutating requests. Validate it
    // (or Referer when Origin is absent). Requests with neither header are not
    // browser CSRF vectors and the SameSite=lax auth cookie is the backstop.
    if (origin) {
      this.assertSameOrigin(origin, 'origin');
    } else if (referer) {
      this.assertSameOrigin(referer, 'referer');
    }

    next();
  }

  private assertSameOrigin(value: string, kind: 'origin' | 'referer') {
    let candidate: string;
    try {
      candidate = new URL(value).origin;
    } catch {
      this.logger.warn(`CSRF blocked: invalid ${kind} header "${value}"`);
      throw new ForbiddenException(`CSRF validation failed: invalid ${kind}`);
    }
    if (candidate !== this.allowedOrigin) {
      this.logger.warn(`CSRF blocked: ${kind} ${value} not in allowed domain`);
      throw new ForbiddenException(`CSRF validation failed: ${kind} mismatch`);
    }
  }
}
