"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRepo, syncRepo } from "@/lib/api";
import type { Repo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncStatusBadge } from "@/components/app/SyncStatusBadge";

export default function RepoOverviewPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [repo, setRepo] = useState<Repo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getRepo(repoId)
      .then(setRepo)
      .catch((err) => setError(err.response?.data?.message || "Failed to load repository"))
      .finally(() => setLoading(false));
  }, [repoId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncRepo(repoId);
      const maxAttempts = 60;
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const updated = await getRepo(repoId);
        setRepo(updated);
        if (updated.status === "ready" || updated.status === "error") break;
      }
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded-md animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !repo) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard" className="text-sm text-text-tertiary hover:text-text-primary">
          &larr; Back to repositories
        </Link>
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  const isSyncing = repo.status === "syncing" || syncing;
  const progressPercent = repo.totalCommitsToSync > 0
    ? Math.min(100, Math.round((repo.totalCommitsSynced / repo.totalCommitsToSync) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <Link href="/dashboard" className="hover:text-text-primary transition-colors">Repositories</Link>
        <span aria-hidden="true">/</span>
        <span className="text-text-primary">{repo.fullName}</span>
      </div>

      {/* Header */}
      <div className="card-linear p-6 space-y-4 animate-fade-in-up">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>{repo.fullName}</h1>
              <SyncStatusBadge status={repo.status} />
            </div>
            <p className="text-text-secondary">{repo.description || "No description"}</p>
          </div>
          <Button onClick={handleSync} disabled={isSyncing} className="btn-linear-primary">
            {isSyncing ? "Syncing…" : "Sync Now"}
          </Button>
        </div>

        {/* Sync progress */}
        {isSyncing && (
          <div>
            {repo.totalCommitsToSync > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs text-text-tertiary mb-1 tabular-nums">
                  <span>{repo.totalCommitsSynced} / {repo.totalCommitsToSync} commits</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-surface-2 rounded-full h-1.5">
                  <div
                    className="bg-brand-indigo h-1.5 rounded-full transition-[width] duration-500"
                    style={{ width: `${progressPercent}%` }}
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </>
            ) : (
              <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
                <div className="bg-brand-indigo h-1.5 rounded-full w-1/3 animate-pulse" />
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {repo.status === "error" && repo.errorMessage && (
          <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20" role="alert">
            <p className="text-sm text-destructive">{repo.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Commits", value: repo.totalCommitsSynced },
          { label: "Stars", value: repo.starsCount.toLocaleString() },
          { label: "Language", value: repo.language || "—" },
          { label: "Last Synced", value: formatDate(repo.lastSyncedAt), isDate: true },
        ].map((stat, i) => (
          <Card key={stat.label} className={`card-linear animate-fade-in-up animate-delay-${(i + 1) * 100}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-text-tertiary uppercase tracking-wide font-feature-settings-cv01-ss03">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${stat.isDate ? "text-sm font-medium" : "text-3xl font-medium"} tabular-nums text-text-primary font-feature-settings-cv01-ss03`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/dashboard/repos/${repoId}/commits`}>
          <Button variant="outline" disabled={repo.status !== "ready"} className="btn-linear-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" /><line x1="3" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="21" y2="12" />
            </svg>
            View Commits
          </Button>
        </Link>
        <Link href={`/dashboard/repos/${repoId}/releases`}>
          <Button variant="outline" disabled={repo.status !== "ready"} className="btn-linear-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2" aria-hidden="true">
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" /><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
            </svg>
            View Releases
          </Button>
        </Link>
        <Link href={`/dashboard/repos/${repoId}/analytics`}>
          <Button variant="outline" disabled={repo.status !== "ready"} className="btn-linear-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2" aria-hidden="true">
              <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
            Analytics
          </Button>
        </Link>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-4 text-sm text-text-tertiary">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${repo.isPrivate ? "bg-amber-400" : "bg-emerald-400"}`} aria-hidden="true" />
          {repo.isPrivate ? "Private" : "Public"} repository
        </div>
        <div>Default branch: <code className="bg-surface-2 px-1.5 py-0.5 rounded text-xs font-mono">{repo.defaultBranch}</code></div>
        <div>Connected: {formatDate(repo.createdAt)}</div>
      </div>
    </div>
  );
}
