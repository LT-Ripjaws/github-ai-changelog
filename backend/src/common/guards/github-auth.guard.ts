import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  private readonly logger = new Logger(GithubAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (err: unknown) {
      // Auth failed: let the request continue to the handler.
      // The handler checks req.user and redirects with an error fragment.
      this.logger.warn('GitHub OAuth canActivate failed (non-fatal)', err instanceof Error ? err.message : String(err));
      return true;
    }
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      // Return null instead of throwing, handler checks for this
      return null as TUser;
    }
    return user;
  }
}
