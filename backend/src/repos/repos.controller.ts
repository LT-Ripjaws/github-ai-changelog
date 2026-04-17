import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ReposService } from './repos.service';
import { CreateRepoDto } from './dto/create-repo.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('repos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repos')
export class ReposController {
  constructor(
    private readonly reposService: ReposService,
    private readonly usersService: UsersService,
  ) {}

  
   // Get the user's access token for GitHub API calls
   
  private async getAccessToken(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    if (!user?.accessToken) {
      throw new Error('User access token not found');
    }
    return user.accessToken;
  }

  @Post()
  @ApiOperation({ summary: 'Connect a GitHub repository' })
  @ApiBody({ type: CreateRepoDto })
  @ApiResponse({ status: 201, description: 'Repository connected and sync queued' })
  @ApiBadRequestResponse({ description: 'Invalid repository format' })
  @ApiNotFoundResponse({ description: 'Repository not found on GitHub' })
  @ApiConflictResponse({ description: 'Repository already connected' })
  async create(
    @Body() dto: CreateRepoDto,
    @CurrentUser() user: { id: string },
  ) {
    const accessToken = await this.getAccessToken(user.id);
    return this.reposService.create(dto, user.id, accessToken);
  }

  @Get()
  @ApiOperation({ summary: 'Get all connected repositories' })
  @ApiResponse({ status: 200, description: 'List of repositories' })
  async findAll(@CurrentUser() user: { id: string }) {
    return this.reposService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single repository' })
  @ApiParam({ name: 'id', description: 'Repository UUID' })
  @ApiResponse({ status: 200, description: 'Repository details' })
  @ApiNotFoundResponse({ description: 'Repository not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.reposService.findOne(id, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a connected repository' })
  @ApiParam({ name: 'id', description: 'Repository UUID' })
  @ApiResponse({ status: 200, description: 'Repository removed' })
  @ApiNotFoundResponse({ description: 'Repository not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.reposService.remove(id, user.id);
    return { message: 'Repo removed' };
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger a sync for a repository' })
  @ApiParam({ name: 'id', description: 'Repository UUID' })
  @ApiResponse({ status: 202, description: 'Sync queued' })
  @ApiConflictResponse({ description: 'Sync already in progress' })
  @ApiNotFoundResponse({ description: 'Repository not found' })
  async sync(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    const accessToken = await this.getAccessToken(user.id);
    return this.reposService.queueSync(id, user.id, accessToken);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get sync status for a repository' })
  @ApiParam({ name: 'id', description: 'Repository UUID' })
  @ApiResponse({ status: 200, description: 'Sync status details' })
  @ApiNotFoundResponse({ description: 'Repository not found' })
  async getStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.reposService.getStatus(id, user.id);
  }
}
