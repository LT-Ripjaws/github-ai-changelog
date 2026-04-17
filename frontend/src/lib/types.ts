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
  createdAt: string;
  updatedAt: string;
}

export interface RepoStatus {
  status: 'pending' | 'syncing' | 'ready' | 'error';
  totalCommitsSynced: number;
  errorMessage: string | null;
  lastSyncedAt: string | null;
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
