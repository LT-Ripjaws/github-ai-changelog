import { Injectable, Logger } from '@nestjs/common';

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
  parents?: Array<{ sha: string }>;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer?: {
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
    patch?: string;
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

export interface GitHubCompareResponse {
  commits?: Array<{ sha: string }>;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly baseUrl = 'https://api.github.com';

  private repoPath(owner: string, repo: string): string {
    return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  }

  private async fetchWithAuth<T>(endpoint: string, accessToken: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'RepoNarrate',
        },
        signal: controller.signal,
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

      const data = await response.json();
      if (data === null || typeof data !== 'object') {
        throw new Error(`GitHub API returned invalid JSON for ${endpoint}`);
      }
      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getRepo(
    owner: string,
    repo: string,
    accessToken: string,
  ): Promise<GitHubRepoResponse> {
    return this.fetchWithAuth<GitHubRepoResponse>(this.repoPath(owner, repo), accessToken);
  }

  async getCommits(
    owner: string,
    repo: string,
    accessToken: string,
    limit: number = 100,
  ): Promise<GitHubCommitResponse[]> {
    const params = new URLSearchParams({ per_page: String(limit) });
    return this.fetchWithAuth<GitHubCommitResponse[]>(
      `${this.repoPath(owner, repo)}/commits?${params}`,
      accessToken,
    );
  }

  async getCommitDetail(
    owner: string,
    repo: string,
    sha: string,
    accessToken: string,
  ): Promise<GitHubCommitResponse> {
    return this.fetchWithAuth<GitHubCommitResponse>(
      `${this.repoPath(owner, repo)}/commits/${encodeURIComponent(sha)}`,
      accessToken,
    );
  }

  async getReleases(
    owner: string,
    repo: string,
    accessToken: string,
  ): Promise<GitHubReleaseResponse[]> {
    return this.fetchWithAuth<GitHubReleaseResponse[]>(
      `${this.repoPath(owner, repo)}/releases`,
      accessToken,
    );
  }

  async compareCommits(
    owner: string,
    repo: string,
    base: string,
    head: string,
    accessToken: string,
  ): Promise<GitHubCompareResponse> {
    return this.fetchWithAuth<GitHubCompareResponse>(
      `${this.repoPath(owner, repo)}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
      accessToken,
    );
  }
}
