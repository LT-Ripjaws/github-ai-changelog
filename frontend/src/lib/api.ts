import axios from 'axios';
import { API_URL } from './config';
import type { User, Repo, RepoStatus, Commit, Release, PaginatedResponse, SearchResult, Analytics } from './types';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // browser auto-sends the httpOnly auth cookie
});

// CSRF is enforced server-side via Origin/Referer allowlist + SameSite=lax
// auth cookie. No client token is needed (and a cross-origin SPA cannot read
// an API-domain cookie anyway).

// On 401 from an authenticated area, the cookie expired/was cleared. Bounce to
// "/" so the server-side SSR auth gate re-runs. Scoped to /dashboard so the
// landing page's expected anonymous /auth/me 401 does NOT cause a redirect.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      error?.response?.status === 401 &&
      window.location.pathname.startsWith('/dashboard')
    ) {
      window.location.replace('/');
    }
    return Promise.reject(error);
  },
);

// Auth
export const getMe = () => api.get<User>('/auth/me').then(r => r.data);

// Repos
export const getRepos = () => api.get<Repo[]>('/repos').then(r => r.data);
export const getRepo = (id: string) => api.get<Repo>(`/repos/${id}`).then(r => r.data);
export const createRepo = (fullName: string) => api.post<Repo>('/repos', { fullName }).then(r => r.data);
export const deleteRepo = (id: string) => api.delete<{ message: string }>(`/repos/${id}`).then(r => r.data);
export const syncRepo = (id: string) => api.post<{ message: string }>(`/repos/${id}/sync`).then(r => r.data);
export const getRepoStatus = (id: string) => api.get<RepoStatus>(`/repos/${id}/status`).then(r => r.data);

// Commits
export const getCommits = (
  repoId: string,
  params?: { page?: number; limit?: number; category?: string; from?: string; to?: string }
) => api.get<PaginatedResponse<Commit>>(`/repos/${repoId}/commits`, { params }).then(r => r.data);

export const getCommit = (repoId: string, sha: string) =>
  api.get<Commit>(`/repos/${repoId}/commits/${sha}`).then(r => r.data);

// Releases
export const getReleases = (repoId: string, params?: { page?: number; limit?: number }) =>
  api.get<PaginatedResponse<Release>>(`/repos/${repoId}/releases`, { params }).then(r => r.data);

export const getRelease = (repoId: string, id: string) =>
  api.get<Release>(`/repos/${repoId}/releases/${id}`).then(r => r.data);

export const getReleaseByTagName = (repoId: string, tagName: string) =>
  api.get<Release>(`/repos/${repoId}/releases/tag/${encodeURIComponent(tagName)}`).then(r => r.data);

// Semantic Search
export const searchCommits = (repoId: string, query: string, limit?: number) =>
  api.post<{ results: SearchResult[] }>(`/repos/${repoId}/commits/search`, { query, limit }).then(r => r.data);

// Analytics
export const getAnalytics = (repoId: string, params?: { from?: string; to?: string }) =>
  api.get<Analytics>(`/repos/${repoId}/analytics`, { params }).then(r => r.data);

export default api;
