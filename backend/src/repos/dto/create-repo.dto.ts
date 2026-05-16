import { IsString, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const GITHUB_OWNER_RE = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?';
const GITHUB_REPO_RE = '(?!\\.\\.?$)[A-Za-z0-9._-]{1,100}';
const GITHUB_FULL_NAME_RE = new RegExp(`^${GITHUB_OWNER_RE}/${GITHUB_REPO_RE}$`);

export class CreateRepoDto {
  @ApiProperty({
    example: 'facebook/react',
    description: 'GitHub repository in owner/repo format',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(GITHUB_FULL_NAME_RE, {
    message: 'fullName must be a valid GitHub owner/repo name',
  })
  fullName: string;
}
