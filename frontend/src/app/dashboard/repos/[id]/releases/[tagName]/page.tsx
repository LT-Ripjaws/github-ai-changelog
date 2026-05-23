import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReleaseByTagNameServer } from '@/lib/server-api';
import { Badge } from '@/components/ui/badge';
import type { Release } from '@/lib/types';
import { formatDate } from '@/lib/format';

export default async function ReleaseDetailPage({
  params,
}: {
  params: { id: string; tagName: string };
}) {
  const cookie = (await headers()).get('cookie') ?? null;
  const { id, tagName: rawTagName } = params;
  const tagName = decodeURIComponent(rawTagName);

  let release: Release;
  try {
    release = await getReleaseByTagNameServer(id, tagName, cookie);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-linear space-y-4 p-4 animate-fade-in-up sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="break-all text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>{release.tagName}</h1>
              {release.releaseName && (
                <span className="break-words text-text-tertiary text-lg">&mdash; {release.releaseName}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-tertiary">
              <span>{formatDate(release.releasedAt, { withWeekday: true, withTime: true })}</span>
              <span className="tabular-nums">{release.commitsCount} commits</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {release.breakingChanges?.length > 0 && (
              <Badge className="bg-cat-breaking/15 text-cat-breaking border-cat-breaking/30 tabular-nums">
                {release.breakingChanges.length} breaking
              </Badge>
            )}
            {release.features?.length > 0 && (
              <Badge className="bg-cat-feature/15 text-cat-feature border-cat-feature/30 tabular-nums">
                {release.features.length} features
              </Badge>
            )}
            {release.fixes?.length > 0 && (
              <Badge className="bg-cat-fix/15 text-cat-fix border-cat-fix/30 tabular-nums">
                {release.fixes.length} fixes
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {release.aiSummary && (
        <div className="card-linear space-y-2 p-4 animate-fade-in-up animate-delay-100 sm:p-6">
          <h2 className="text-sm font-medium text-text-tertiary uppercase tracking-wide flex items-center gap-2 font-feature-settings-cv01-ss03">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" /><circle cx="12" cy="14" r="2" />
            </svg>
            AI Summary
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">{release.aiSummary}</p>
        </div>
      )}

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {release.breakingChanges?.length > 0 && (
          <div className="card-linear p-5 space-y-3 animate-fade-in-up animate-delay-100">
            <h3 className="text-sm font-medium text-cat-breaking flex items-center gap-2 font-feature-settings-cv01-ss03">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Breaking Changes ({release.breakingChanges.length})
            </h3>
            <ul className="space-y-1.5">
              {release.breakingChanges.map((item: string, i: number) => (
                <li key={i} className="break-words border-l-2 border-cat-breaking/30 pl-4 text-sm text-text-secondary">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {release.features?.length > 0 && (
          <div className="card-linear p-5 space-y-3 animate-fade-in-up animate-delay-200">
            <h3 className="text-sm font-medium text-cat-feature flex items-center gap-2 font-feature-settings-cv01-ss03">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Features ({release.features.length})
            </h3>
            <ul className="space-y-1.5">
              {release.features.map((item: string, i: number) => (
                <li key={i} className="break-words border-l-2 border-cat-feature/30 pl-4 text-sm text-text-secondary">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {release.fixes?.length > 0 && (
          <div className="card-linear p-5 space-y-3 animate-fade-in-up animate-delay-200">
            <h3 className="text-sm font-medium text-cat-fix flex items-center gap-2 font-feature-settings-cv01-ss03">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              Fixes ({release.fixes.length})
            </h3>
            <ul className="space-y-1.5">
              {release.fixes.map((item: string, i: number) => (
                <li key={i} className="break-words border-l-2 border-cat-fix/30 pl-4 text-sm text-text-secondary">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {release.chores?.length > 0 && (
          <div className="card-linear p-5 space-y-3 animate-fade-in-up animate-delay-300">
            <h3 className="text-sm font-medium text-cat-chore flex items-center gap-2 font-feature-settings-cv01-ss03">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
              </svg>
              Chores ({release.chores.length})
            </h3>
            <ul className="space-y-1.5">
              {release.chores.map((item: string, i: number) => (
                <li key={i} className="break-words border-l-2 border-cat-chore/30 pl-4 text-sm text-text-secondary">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Raw body fallback */}
      {!release.aiSummary && release.rawBody && (
        <div className="card-linear space-y-2 p-4 sm:p-6">
          <h2 className="text-sm font-medium text-text-tertiary uppercase tracking-wide font-feature-settings-cv01-ss03">Raw Notes</h2>
          <pre className="overflow-x-auto break-words rounded-md bg-surface-2 p-4 font-sans text-sm text-text-secondary whitespace-pre-wrap">{release.rawBody}</pre>
        </div>
      )}

      {/* Back link */}
      <div className="pt-2">
        <Link href={`/dashboard/repos/${id}/releases`} className="text-sm text-text-tertiary hover:text-text-primary transition-colors">
          &larr; Back to all releases
        </Link>
      </div>
    </div>
  );
}
