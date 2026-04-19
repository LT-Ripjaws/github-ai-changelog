import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      // Auth failed: let the request continue to the handler
      // The handler will check req.user and redirect with error
      return true;
    }
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      // Return null instead of throwing, handler checks for this
      return null;
    }
    return user;
  }
}
