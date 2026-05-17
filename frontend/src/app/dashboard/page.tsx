// Server wrapper — fetches repos, passes to client component
import { headers } from 'next/headers';
import { getReposServer } from '@/lib/server-api';
import type { Repo } from '@/lib/types';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const cookie = (await headers()).get('cookie') ?? null;

  let repos: Repo[] = [];
  try {
    repos = await getReposServer(cookie);
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-medium text-text-primary font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>Repositories</h1>
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20">
          <p className="text-destructive">Failed to fetch repositories</p>
        </div>
      </div>
    );
  }

  return <DashboardClient initialRepos={repos} />;
}
