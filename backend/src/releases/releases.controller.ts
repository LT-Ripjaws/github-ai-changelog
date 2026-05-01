import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReleasesService } from './releases.service';
import { ReposService } from '../repos/repos.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('releases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repos/:repoId/releases')
export class ReleasesController {
  constructor(
    private releasesService: ReleasesService,
    private reposService: ReposService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List releases for a repo' })
  @ApiParam({ name: 'repoId', description: 'Repository UUID' })
  @ApiOkResponse({ description: 'Paginated list of releases' })
  async findAll(
    @Param('repoId') repoId: string,
    @Query() query: PaginationDto,
    @CurrentUser() user: any,
  ) {
    await this.reposService.findOne(repoId, user.id);
    return this.releasesService.findAll(repoId, query.page, query.limit);
  }

  @Get('tag/:tagName')
  @ApiOperation({ summary: 'Get a release by tag name' })
  @ApiParam({ name: 'repoId', description: 'Repository UUID' })
  @ApiParam({ name: 'tagName', description: 'Git tag name (e.g. v1.0.0)' })
  @ApiOkResponse({ description: 'Release details' })
  @ApiNotFoundResponse({ description: 'Release not found' })
  async findByTagName(
    @Param('repoId') repoId: string,
    @Param('tagName') tagName: string,
    @CurrentUser() user: any,
  ) {
    await this.reposService.findOne(repoId, user.id);
    return this.releasesService.findByTagName(repoId, tagName);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single release by ID' })
  @ApiParam({ name: 'repoId', description: 'Repository UUID' })
  @ApiParam({ name: 'id', description: 'Release UUID' })
  @ApiOkResponse({ description: 'Release details' })
  @ApiNotFoundResponse({ description: 'Release not found' })
  async findOne(
    @Param('repoId') repoId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.reposService.findOne(repoId, user.id);
    return this.releasesService.findOne(repoId, id);
  }
}
