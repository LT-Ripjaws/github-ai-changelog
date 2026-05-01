import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CommitsService } from './commits.service';
import { ListCommitsDto } from './dto/list-commits.dto';
import { SearchCommitsDto } from './dto/search-commits.dto';
import { ReposService } from '../repos/repos.service';

@ApiTags('commits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repos/:repoId/commits')
export class CommitsController {
  constructor(
    private commitsService: CommitsService,
    private reposService: ReposService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List commits for a repo with pagination and filters' })
  @ApiParam({ name: 'repoId', description: 'Repository UUID' })
  @ApiOkResponse({ description: 'Paginated list of commits' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category (breaking/feature/fix/chore/docs/refactor)' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601)' })
  async findAll(
    @Param('repoId') repoId: string,
    @Query() query: ListCommitsDto,
    @CurrentUser() user: any,
  ) {
    // Verify user owns the repo
    await this.reposService.findOne(repoId, user.id);
    return this.commitsService.findAll(repoId, query);
  }

  @Get(':sha')
  @ApiOperation({ summary: 'Get a single commit by SHA' })
  @ApiParam({ name: 'repoId', description: 'Repository UUID' })
  @ApiParam({ name: 'sha', description: 'Commit SHA' })
  @ApiOkResponse({ description: 'Commit details' })
  @ApiNotFoundResponse({ description: 'Commit not found' })
  async findOne(
    @Param('repoId') repoId: string,
    @Param('sha') sha: string,
    @CurrentUser() user: any,
  ) {
    // Verify user owns the repo
    await this.reposService.findOne(repoId, user.id);
    return this.commitsService.findOne(repoId, sha);
  }

  @Post('search')
  @ApiOperation({ summary: 'Semantic search over commits using natural language' })
  @ApiParam({ name: 'repoId', description: 'Repository UUID' })
  @ApiOkResponse({ description: 'Ranked list of commits matching the query' })
  async search(
    @Param('repoId') repoId: string,
    @Body() body: SearchCommitsDto,
    @CurrentUser() user: any,
  ) {
    await this.reposService.findOne(repoId, user.id);
    return this.commitsService.semanticSearch(repoId, body.query, body.limit);
  }
}
