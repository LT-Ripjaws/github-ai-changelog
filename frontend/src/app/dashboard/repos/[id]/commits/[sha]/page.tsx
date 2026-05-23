import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getCommitServer } from '@/lib/server-api';
import { Badge } from '@/components/ui/badge';
import { CATEGORY_COLORS } from '@/lib/constants';
import type { Commit } from '@/lib/types';
import { formatDate } from '@/lib/format';

export default async function CommitDetailPage({
  params,
}: {
  params: { id: string; sha: string };
}) {
  const cookie = (await headers()).get('cookie') ?? null;
  const { id, sha } = params;

  let commit: Commit;
  try {
    commit = await getCommitServer(id, sha, cookie);
  } catch {
    notFound();
  }

  const commitMessage = commit.message.split("\n");
  const title = commitMessage[0];
  const body = commitMessage.slice(1).join("\n").trim();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-linear space-y-4 p-4 animate-fade-in-up sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-2 min-w-0">
            <h1 className="break-words text-xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03">{title}</h1>
            {body && (
              <pre className="break-words text-sm text-text-secondary whitespace-pre-wrap font-sans">{body}</pre>
            )}
          </div>
          {commit.category && (
            <Badge variant="outline" className={`capitalize shrink-0 badge-linear-neutral ${CATEGORY_COLORS[commit.category] || ""}`}>
              {commit.category}
            </Badge>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-6 gap-y-3 border-t border-border-subtle pt-4 text-sm text-text-tertiary">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span>{commit.authorName || commit.authorGithubLogin || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatDate(commit.committedAt, { withWeekday: true, withTime: true })}</span>
          </div>
          <div className="flex items-center gap-3 tabular-nums">
            <span className="text-cat-feature">+{commit.additions}</span>
            <span className="text-cat-breaking">-{commit.deletions}</span>
            <span>{commit.filesChanged} files changed</span>
          </div>
          <code className="max-w-full break-all rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">{commit.sha}</code>
        </div>
      </div>

      {/* AI Changelog */}
      {commit.aiChangelog && (
        <div className="card-linear space-y-2 p-4 animate-fade-in-up animate-delay-100 sm:p-6">
          <h2 className="text-sm font-medium text-text-tertiary uppercase tracking-wide flex items-center gap-2 font-feature-settings-cv01-ss03">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" /><circle cx="12" cy="14" r="2" />
            </svg>
            AI Changelog
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">{commit.aiChangelog}</p>
        </div>
      )}

      {/* Diff Summary */}
      {commit.diffSummary && (
        <div className="card-linear space-y-2 p-4 animate-fade-in-up animate-delay-200 sm:p-6">
          <h2 className="text-sm font-medium text-text-tertiary uppercase tracking-wide flex items-center gap-2 font-feature-settings-cv01-ss03">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            Diff Summary
          </h2>
          <pre className="overflow-x-auto rounded-md bg-surface-2 p-4 font-mono text-xs leading-relaxed text-text-secondary whitespace-pre-wrap">{commit.diffSummary}</pre>
        </div>
      )}
    </div>
  );
}
