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
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RedisPubSubService } from '../common/pubsub/redis-pubsub.service';
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
    private readonly pubsub: RedisPubSubService,
  ) {}

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
    const accessToken = await this.usersService.getAccessToken(user.id);
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
    return this.reposService.queueSync(id, user.id);
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

  // Phase 4: live sync status over SSE. Same JwtAuthGuard (class-level) +
  // ownership check as getStatus. Emits an initial snapshot, then streams
  // pub/sub updates. The frontend keeps polling as an automatic fallback,
  // so this endpoint existing is inert until STATUS_TRANSPORT=sse is used.
  @Sse(':id/status/stream')
  @ApiOperation({ summary: 'Stream sync status (SSE)' })
  @ApiParam({ name: 'id', description: 'Repository UUID' })
  streamStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let closed = false;
      let handle: { close: () => void } | undefined;

      void (async () => {
        try {
          // Ownership: getStatus throws NotFound if the repo isn't the user's.
          const initial = await this.reposService.getStatus(id, user.id);
          if (closed) return;
          subscriber.next({ data: initial } as MessageEvent);
          handle = await this.pubsub.subscribe(this.pubsub.channel(id), (data) => {
            if (!closed) subscriber.next({ data } as MessageEvent);
          });
          if (closed) handle.close();
        } catch (err) {
          subscriber.error(err);
        }
      })();

      return () => {
        closed = true;
        handle?.close();
      };
    });
  }
}
