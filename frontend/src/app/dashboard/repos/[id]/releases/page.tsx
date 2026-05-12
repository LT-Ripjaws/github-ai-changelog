// Server wrapper — fetches repo + releases, passes to client component
import { headers } from 'next/headers';
import Link from 'next/link';
import { getRepoServer, getReleasesServer } from '@/lib/server-api';
import ReleasesClient from './ReleasesClient';

export default async function ReleasesPage({
  params,
}: {
  params: { id: string };
}) {
  const cookie = (await headers()).get('cookie') ?? null;

  let repo: any;
  let releasesData: any;
  try {
    [repo, releasesData] = await Promise.all([
      getRepoServer(params.id, cookie),
      getReleasesServer(params.id, cookie, { page: 1, limit: 20 }),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-medium text-text-primary">Releases</h1>
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20">
          <p className="text-destructive">Failed to load releases</p>
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
          <span className="text-text-primary">Releases</span>
        </div>
        <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>
          Releases {releasesData.meta?.total > 0 ? <span className="text-text-tertiary font-normal text-lg tabular-nums">({releasesData.meta.total})</span> : null}
        </h1>
      </div>

      {/* Interactive section: expand/collapse, pagination — client island */}
      <ReleasesClient
        key={params.id}
        repoId={params.id}
        repoName={repo.fullName}
        initialData={{ releases: releasesData.data, meta: releasesData.meta }}
      />
    </div>
  );
}
