import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GithubAuthGuard } from '../common/guards/github-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
    private usersService: UsersService,
  ) {}

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() { /* Passport handles redirect */ }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: any, @Res() res: any) {
    if (!req.user) {
      // Auth failed: redirect to frontend with error
      return res.redirect(`${this.config.get('FRONTEND_URL')}/auth/callback#error=github_auth_failed`);
    }
    const token = await this.authService.login(req.user);
    // Use hash fragment 
    res.redirect(`${this.config.get('FRONTEND_URL')}/auth/callback#token=${token}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async me(@CurrentUser() user: { id: string }) {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) return null;
    const { accessToken, ...safe } = fullUser;
    return safe;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  logout() {
    return { message: 'Logged out' };
  }
}
