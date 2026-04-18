import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiNotFoundResponse } from '@nestjs/swagger';
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
  @ApiOkResponse({ description: 'Paginated list of releases' })
  async findAll(
    @Param('repoId') repoId: string,
    @Query() query: PaginationDto,
    @CurrentUser() user: any,
  ) {
    await this.reposService.findOne(repoId, user.id);
    return this.releasesService.findAll(repoId, query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single release' })
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
