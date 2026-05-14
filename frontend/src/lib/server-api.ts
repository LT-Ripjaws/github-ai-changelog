/** Server-side API helpers using native fetch.
 * These run in RSC/SSR context — no axios, no localStorage.
 * The browser cookie is forwarded to the backend via Cookie header. */

import { cache } from 'react';
import type { User } from './types';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

function headers(cookie: string | null) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) h.Cookie = cookie;
  return h;
}

export const getMeServer = cache(async (cookie: string | null): Promise<User | null> => {
  const res = await fetch(`${BACKEND_URL}/auth/me`, { headers: headers(cookie), cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch current user: ${res.status}`);
  return res.json();
});

/** Cached per-request: if multiple server components need the same repo
 * in one render, the fetch runs only once. */
export const getRepoServer = cache(async (id: string, cookie: string | null) => {
  const res = await fetch(`${BACKEND_URL}/repos/${id}`, { headers: headers(cookie), cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch repo: ${res.status}`);
  return res.json();
});

export async function getCommitServer(repoId: string, sha: string, cookie: string | null) {
  const res = await fetch(`${BACKEND_URL}/repos/${repoId}/commits/${sha}`, { headers: headers(cookie), cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch commit: ${res.status}`);
  return res.json();
}

export async function getReleaseByTagNameServer(repoId: string, tagName: string, cookie: string | null) {
  const res = await fetch(`${BACKEND_URL}/repos/${repoId}/releases/tag/${encodeURIComponent(tagName)}`, { headers: headers(cookie), cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch release: ${res.status}`);
  return res.json();
}

export async function getAnalyticsServer(repoId: string, cookie: string | null) {
  const res = await fetch(`${BACKEND_URL}/repos/${repoId}/analytics`, { headers: headers(cookie), cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`);
  return res.json();
}

export async function getReposServer(cookie: string | null) {
  const res = await fetch(`${BACKEND_URL}/repos`, { headers: headers(cookie), cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch repos: ${res.status}`);
  return res.json();
}

export async function getCommitsServer(
  repoId: string,
  cookie: string | null,
  params?: { page?: number; limit?: number; category?: string },
) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  if (params?.category) sp.set('category', params.category);
  const url = `${BACKEND_URL}/repos/${repoId}/commits?${sp.toString()}`;
  const res = await fetch(url, { headers: headers(cookie), cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch commits: ${res.status}`);
  return res.json();
}

export async function getReleasesServer(
  repoId: string,
  cookie: string | null,
  params?: { page?: number; limit?: number },
) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const url = `${BACKEND_URL}/repos/${repoId}/releases?${sp.toString()}`;
  const res = await fetch(url, { headers: headers(cookie), cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch releases: ${res.status}`);
  return res.json();
}
