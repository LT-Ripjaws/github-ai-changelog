// Server wrapper — fetches repo + commits, passes to client component
import { headers } from 'next/headers';
import Link from 'next/link';
import { getRepoServer, getCommitsServer } from '@/lib/server-api';
import CommitsClient from './CommitsClient';

export default async function CommitsPage({
  params,
}: {
  params: { id: string };
}) {
  const cookie = (await headers()).get('cookie') ?? null;

  let repo: any;
  let commitsData: any;
  try {
    [repo, commitsData] = await Promise.all([
      getRepoServer(params.id, cookie),
      getCommitsServer(params.id, cookie, { page: 1, limit: 20 }),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-medium text-text-primary">Commits</h1>
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20">
          <p className="text-destructive">Failed to load commits</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header — static HTML from server */}
      <div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary mb-2">
          <Link href="/dashboard" className="hover:text-text-primary transition-colors" prefetch>Repositories</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/dashboard/repos/${params.id}`} className="hover:text-text-primary transition-colors" prefetch>{repo?.fullName || "..."}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-text-primary">Commits</span>
        </div>
        <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>
          Commits {commitsData.meta?.total > 0 ? <span className="text-text-tertiary font-normal text-lg tabular-nums">({commitsData.meta.total})</span> : null}
        </h1>
      </div>

      {/* Interactive section: filters, search, pagination — client island */}
      <CommitsClient
        key={params.id}
        repoId={params.id}
        repoName={repo.fullName}
        initialData={{ commits: commitsData.data, meta: commitsData.meta }}
      />
    </div>
  );
}
