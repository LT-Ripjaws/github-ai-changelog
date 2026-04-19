import axios from 'axios';
import type { User, Repo, RepoStatus, Commit, Release, PaginatedResponse } from './types';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('jwt_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
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

export default api;
