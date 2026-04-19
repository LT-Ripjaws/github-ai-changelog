import { IsOptional, IsISO8601 } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO 8601 format)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO 8601 format)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
