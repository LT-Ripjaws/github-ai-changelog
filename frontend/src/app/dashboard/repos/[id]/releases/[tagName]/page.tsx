"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRepo, getReleaseByTagName } from "@/lib/api";
import type { Release, Repo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function ReleaseDetailPage() {
  const params = useParams();
  const repoId = params.id as string;
  const tagName = decodeURIComponent(params.tagName as string);

  const [repo, setRepo] = useState<Repo | null>(null);
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getRepo(repoId),
      getReleaseByTagName(repoId, tagName),
    ])
      .then(([repoData, releaseData]) => {
        setRepo(repoData);
        setRelease(releaseData);
      })
      .catch((err) => setError(err.response?.data?.message || "Release not found"))
      .finally(() => setLoading(false));
  }, [repoId, tagName]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-md animate-pulse" />
        <div className="h-32 bg-muted rounded-md animate-pulse" />
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="space-y-4">
        <Link href={`/dashboard/repos/${repoId}/releases`} className="text-sm text-text-tertiary hover:text-text-primary">
          &larr; Back to releases
        </Link>
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20" role="alert">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <Link href="/dashboard" className="hover:text-text-primary transition-colors">Repositories</Link>
        <span aria-hidden="true">/</span>
        <Link href="/dashboard" className="hover:text-text-primary transition-colors">{repo?.fullName || "..."}</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/dashboard/repos/${repoId}/releases`} className="hover:text-text-primary transition-colors">Releases</Link>
        <span aria-hidden="true">/</span>
        <span className="text-text-primary">{release.tagName}</span>
      </div>

      {/* Header */}
      <div className="card-linear p-6 space-y-4 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>{release.tagName}</h1>
              {release.releaseName && (
                <span className="text-text-tertiary text-lg">— {release.releaseName}</span>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-text-tertiary">
              <span>{formatDate(release.releasedAt)}</span>
              <span className="tabular-nums">{release.commitsCount} commits</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {release.breakingChanges.length > 0 && (
              <Badge className="bg-red-500/15 text-red-400 border-red-500/30 tabular-nums">
                {release.breakingChanges.length} breaking
              </Badge>
            )}
            {release.features.length > 0 && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 tabular-nums">
                {release.features.length} features
              </Badge>
            )}
            {release.fixes.length > 0 && (
              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 tabular-nums">
                {release.fixes.length} fixes
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {release.aiSummary && (
        <div className="card-linear p-6 space-y-2 animate-fade-in-up animate-delay-100">
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
        {/* Breaking Changes */}
        {release.breakingChanges.length > 0 && (
          <div className="card-linear p-5 space-y-3 animate-fade-in-up animate-delay-100">
            <h3 className="text-sm font-medium text-red-400 flex items-center gap-2 font-feature-settings-cv01-ss03">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Breaking Changes ({release.breakingChanges.length})
            </h3>
            <ul className="space-y-1.5">
              {release.breakingChanges.map((item, i) => (
                <li key={i} className="text-sm pl-4 border-l-2 border-red-500/30 text-text-secondary">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Features */}
        {release.features.length > 0 && (
          <div className="card-linear p-5 space-y-3 animate-fade-in-up animate-delay-200">
            <h3 className="text-sm font-medium text-emerald-400 flex items-center gap-2 font-feature-settings-cv01-ss03">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Features ({release.features.length})
            </h3>
            <ul className="space-y-1.5">
              {release.features.map((item, i) => (
                <li key={i} className="text-sm pl-4 border-l-2 border-emerald-500/30 text-text-secondary">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Fixes */}
        {release.fixes.length > 0 && (
          <div className="card-linear p-5 space-y-3 animate-fade-in-up animate-delay-200">
            <h3 className="text-sm font-medium text-amber-400 flex items-center gap-2 font-feature-settings-cv01-ss03">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              Fixes ({release.fixes.length})
            </h3>
            <ul className="space-y-1.5">
              {release.fixes.map((item, i) => (
                <li key={i} className="text-sm pl-4 border-l-2 border-amber-500/30 text-text-secondary">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Chores */}
        {release.chores.length > 0 && (
          <div className="card-linear p-5 space-y-3 animate-fade-in-up animate-delay-300">
            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2 font-feature-settings-cv01-ss03">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
              </svg>
              Chores ({release.chores.length})
            </h3>
            <ul className="space-y-1.5">
              {release.chores.map((item, i) => (
                <li key={i} className="text-sm pl-4 border-l-2 border-slate-500/30 text-text-secondary">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Raw body fallback */}
      {!release.aiSummary && release.rawBody && (
        <div className="card-linear p-6 space-y-2">
          <h2 className="text-sm font-medium text-text-tertiary uppercase tracking-wide font-feature-settings-cv01-ss03">Raw Notes</h2>
          <pre className="text-sm whitespace-pre-wrap font-sans bg-surface-2 p-4 rounded-md text-text-secondary">{release.rawBody}</pre>
        </div>
      )}

      {/* Back link */}
      <div className="pt-2">
        <Link
          href={`/dashboard/repos/${repoId}/releases`}
          className="text-sm text-text-tertiary hover:text-text-primary transition-colors"
        >
          &larr; Back to all releases
        </Link>
      </div>
    </div>
  );
}
