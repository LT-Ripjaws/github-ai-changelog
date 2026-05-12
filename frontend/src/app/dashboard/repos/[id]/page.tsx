// Server wrapper — fetches repo, passes to client component
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRepoServer } from '@/lib/server-api';
import { SyncButton } from '@/components/repos/SyncButton';

export default async function RepoOverviewPage({
  params,
}: {
  params: { id: string };
}) {
  const cookie = (await headers()).get('cookie') ?? null;

  let repo: any;
  try {
    repo = await getRepoServer(params.id, cookie);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb — static HTML from server */}
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <Link href="/dashboard" className="hover:text-text-primary transition-colors" prefetch>Repositories</Link>
        <span aria-hidden="true">/</span>
        <span className="text-text-primary">{repo.fullName}</span>
      </div>

      {/* Interactive section: sync button, stats, actions — client island */}
      <SyncButton repoId={params.id} initialRepo={repo} />
    </div>
  );
}
