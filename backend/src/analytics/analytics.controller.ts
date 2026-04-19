import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { ReposService } from '../repos/repos.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repos/:repoId/analytics')
export class AnalyticsController {
  constructor(
    private analyticsService: AnalyticsService,
    private reposService: ReposService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get commit analytics for a repo' })
  @ApiOkResponse({ description: 'Commit statistics and breakdowns' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date (ISO 8601 format)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date (ISO 8601 format)' })
  async getAnalytics(
    @Param('repoId') repoId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user?: any,
  ) {
    await this.reposService.findOne(repoId, user.id);
    return this.analyticsService.getAnalytics(repoId, query.from, query.to);
  }
}
