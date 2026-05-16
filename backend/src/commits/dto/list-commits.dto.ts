import { IsISO8601, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

const CATEGORIES = ['breaking', 'feature', 'fix', 'chore', 'docs', 'refactor'];

export class ListCommitsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsString()
  @IsIn(CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
