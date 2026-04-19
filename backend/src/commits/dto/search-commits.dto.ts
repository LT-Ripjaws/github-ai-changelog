import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchCommitsDto {
  @ApiProperty({ description: 'Natural language search query' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({ default: 10, description: 'Max number of results' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
