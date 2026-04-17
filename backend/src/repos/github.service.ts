import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GitHubRepoResponse {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  default_branch: string;
  private: boolean;
  stargazers_count: number;
  language: string | null;
}

export interface GitHubCommitResponse {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
  } | null;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
  files?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
}

export interface GitHubReleaseResponse {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly baseUrl = 'https://api.github.com';

  constructor(private config: ConfigService) {}

  
   // Make authenticated request to GitHub API
   
  private async fetchWithAuth(
    endpoint: string,
    accessToken: string,
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Changelog-AI',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      this.logger.error(`GitHub API error: ${response.status} ${response.statusText}`, error);

      if (response.status === 401) {
        throw new Error('GitHub token expired or revoked — please re-authenticate');
      }
      if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
        throw new Error('GitHub API rate limit exceeded — try again later');
      }
      if (response.status === 404) {
        throw new Error('Repository not found or access denied');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  
    // Get repository info from GitHub
   
  async getRepo(
    owner: string,
    repo: string,
    accessToken: string,
  ): Promise<GitHubRepoResponse> {
    return this.fetchWithAuth(`/repos/${owner}/${repo}`, accessToken);
  }

  
   // Get commits from a repository (last N commits)
   
  async getCommits(
    owner: string,
    repo: string,
    accessToken: string,
    limit: number = 100,
  ): Promise<GitHubCommitResponse[]> {
    return this.fetchWithAuth(
      `/repos/${owner}/${repo}/commits?per_page=${limit}`,
      accessToken,
    );
  }

 
   // Get detailed commit info including diff stats
   
  async getCommitDetail(
    owner: string,
    repo: string,
    sha: string,
    accessToken: string,
  ): Promise<GitHubCommitResponse> {
    return this.fetchWithAuth(
      `/repos/${owner}/${repo}/commits/${sha}`,
      accessToken,
    );
  }

  
   // Get releases from a repository
   
  async getReleases(
    owner: string,
    repo: string,
    accessToken: string,
  ): Promise<GitHubReleaseResponse[]> {
    return this.fetchWithAuth(`/repos/${owner}/${repo}/releases`, accessToken);
  }

  
   // Compare two commits (for diff between versions)
   
  async compareCommits(
    owner: string,
    repo: string,
    base: string,
    head: string,
    accessToken: string,
  ): Promise<any> {
    return this.fetchWithAuth(
      `/repos/${owner}/${repo}/compare/${base}...${head}`,
      accessToken,
    );
  }
}
