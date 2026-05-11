import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub for authorization' })
  githubLogin() { /* Passport handles redirect */ }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with JWT token or error' })
  async githubCallback(@Req() req: any, @Res() res: any) {
    if (!req.user) {
      return res.redirect(`${this.config.get('FRONTEND_URL')}/auth/callback#error=github_auth_failed`);
    }
    const token = await this.authService.login(req.user);
    // Set httpOnly cookie for auth (replaces hash fragment redirect)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.redirect(`${this.config.get('FRONTEND_URL')}/dashboard`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User profile (accessToken excluded)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: { id: string }) {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) return null;
    const { accessToken, ...safe } = fullUser;
    return safe;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out (clear auth cookie)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  logout(@Res() res: any) {
    res.clearCookie('token');
    return res.json({ message: 'Logged out' });
  }
}
