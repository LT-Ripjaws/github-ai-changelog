import { Injectable, Logger } from '@nestjs/common';
import { MetricsService } from '../common/metrics/metrics.service';

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

export interface IncrementalCommitsResult {
  notModified: boolean;
  etag: string | null;
  commits: GitHubCommitResponse[];
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly baseUrl = 'https://api.github.com';

  constructor(private readonly metrics: MetricsService) {}

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

      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining !== null && remaining !== '') {
        this.metrics.setGauge('github_api_rate_limit_remaining', Number(remaining));
      }

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
      this.metrics.incCounter('github_api_calls_total', { outcome: 'success' });
      return data as T;
    } catch (err: unknown) {
      this.metrics.incCounter('github_api_calls_total', { outcome: 'error' });
      throw err;
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

  /**
   * Lower-level fetch that exposes status + headers (needed for ETag / Link /
   * 304). Same auth, timeout, error mapping and metrics as fetchWithAuth.
   * A 304 is a successful conditional response, not an error.
   */
  private async fetchRaw(
    endpoint: string,
    accessToken: string,
    extraHeaders: Record<string, string> = {},
  ): Promise<{ status: number; headers: Headers; data: unknown }> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'RepoNarrate',
          ...extraHeaders,
        },
        signal: controller.signal,
      });

      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining !== null && remaining !== '') {
        this.metrics.setGauge('github_api_rate_limit_remaining', Number(remaining));
      }

      if (response.status === 304) {
        this.metrics.incCounter('github_api_calls_total', { outcome: 'success' });
        return { status: 304, headers: response.headers, data: null };
      }

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
      this.metrics.incCounter('github_api_calls_total', { outcome: 'success' });
      return { status: response.status, headers: response.headers, data };
    } catch (err: unknown) {
      this.metrics.incCounter('github_api_calls_total', { outcome: 'error' });
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  private nextLink(linkHeader: string | null): string {
    if (!linkHeader) return '';
    const next = linkHeader
      .split(',')
      .map((s) => s.trim())
      .find((s) => /rel="next"/.test(s));
    const url = next?.match(/<([^>]+)>/)?.[1];
    if (!url) return '';
    // fetchRaw prepends baseUrl, so return a baseUrl-relative endpoint.
    return url.startsWith(this.baseUrl)
      ? url.slice(this.baseUrl.length)
      : url.replace(/^https?:\/\/api\.github\.com/, '');
  }

  /**
   * Incremental commits fetch (Phase 3b): conditional via If-None-Match,
   * optional `since`, and Link-header pagination up to maxCommits (lifts the
   * old 100 cap). A first-page 304 short-circuits with notModified=true.
   */
  async getCommitsIncremental(
    owner: string,
    repo: string,
    accessToken: string,
    opts: { sinceIso?: string; etag?: string | null; maxCommits: number },
  ): Promise<IncrementalCommitsResult> {
    const params = new URLSearchParams({ per_page: '100' });
    if (opts.sinceIso) params.set('since', opts.sinceIso);
    let endpoint = `${this.repoPath(owner, repo)}/commits?${params}`;

    const commits: GitHubCommitResponse[] = [];
    let etag: string | null = opts.etag ?? null;
    let isFirst = true;

    while (endpoint && commits.length < opts.maxCommits) {
      const conditional: Record<string, string> =
        isFirst && opts.etag ? { 'If-None-Match': opts.etag } : {};
      const res = await this.fetchRaw(endpoint, accessToken, conditional);

      if (isFirst && res.status === 304) {
        return { notModified: true, etag: opts.etag ?? null, commits: [] };
      }
      if (isFirst) etag = res.headers.get('etag') ?? etag;

      const page = Array.isArray(res.data) ? (res.data as GitHubCommitResponse[]) : [];
      commits.push(...page);
      endpoint = this.nextLink(res.headers.get('link'));
      isFirst = false;
    }

    return { notModified: false, etag, commits: commits.slice(0, opts.maxCommits) };
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
