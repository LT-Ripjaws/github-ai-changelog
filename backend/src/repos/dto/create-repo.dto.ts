import { IsString, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRepoDto {
  @ApiProperty({
    example: 'facebook/react',
    description: 'GitHub repository in owner/repo format',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[\w.-]+\/[\w.-]+$/, {
    message: 'fullName must be in owner/repo format',
  })
  fullName: string;
}
