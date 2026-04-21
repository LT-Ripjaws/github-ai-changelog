export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  email: string;
  createdAt: string;
}

export interface Repo {
  id: string;
  userId: string;
  githubRepoId: string;
  fullName: string;
  name: string;
  description: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  starsCount: number;
  language: string | null;
  status: 'pending' | 'syncing' | 'ready' | 'error';
  errorMessage: string | null;
  lastSyncedAt: string | null;
  totalCommitsSynced: number;
  totalCommitsToSync: number;
  createdAt: string;
  updatedAt: string;
}

export interface RepoStatus {
  status: 'pending' | 'syncing' | 'ready' | 'error';
  totalCommitsSynced: number;
  totalCommitsToSync: number;
  errorMessage: string | null;
  lastSyncedAt: string | null;
}

export interface Commit {
  id: string;
  repoId: string;
  sha: string;
  message: string;
  authorName: string | null;
  authorEmail: string | null;
  authorGithubLogin: string | null;
  diffSummary: string | null;
  aiChangelog: string | null;
  category: string | null;
  filesChanged: number;
  additions: number;
  deletions: number;
  isMergeCommit: boolean;
  committedAt: string;
  createdAt: string;
}

export interface Release {
  id: string;
  repoId: string;
  tagName: string;
  releaseName: string | null;
  rawBody: string | null;
  aiSummary: string | null;
  breakingChanges: string[];
  features: string[];
  fixes: string[];
  chores: string[];
  commitsCount: number;
  releasedAt: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchResult {
  id: string;
  sha: string;
  message: string;
  authorName: string | null;
  authorGithubLogin: string | null;
  diffSummary: string | null;
  aiChangelog: string | null;
  category: string | null;
  filesChanged: number;
  additions: number;
  deletions: number;
  committedAt: string;
  similarity: number;
}

export interface Analytics {
  totalCommits: number;
  commitsByCategory: Record<string, number>;
  commitsByMonth: { month: string; count: number }[];
}
