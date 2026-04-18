import { IsOptional, IsString, IsIn } from 'class-validator';
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
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsString()
  to?: string;
}
