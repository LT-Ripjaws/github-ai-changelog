"use client";
import { memo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncStatusBadge } from "@/components/app/SyncStatusBadge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Repo } from "@/lib/types";

interface SyncProgress {
  synced: number;
  total: number;
}

interface RepoCardProps {
  repo: Repo;
  syncProgress: SyncProgress | null;
  onSync: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const RepoCard = memo(function RepoCard({ repo, syncProgress, onSync, onDelete }: RepoCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Progress bar data: from live polling during sync, or from repo prop
  const isSyncing = syncProgress !== null;
  const displayCommits = isSyncing ? syncProgress.synced : repo.totalCommitsSynced;
  const displayTotal = isSyncing ? syncProgress.total : (repo.totalCommitsToSync || 0);
  const progressPercent = displayTotal > 0 ? Math.min(100, Math.round((displayCommits / displayTotal) * 100)) : 0;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync(repo.id);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await onDelete(repo.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="card-linear animate-fade-in-up hover:border-brand-indigo/20 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">
              <Link href={`/dashboard/repos/${repo.id}`} className="hover:text-brand-indigo transition-colors">
                {repo.fullName}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2 text-text-secondary">
              {repo.description || "No description"}
            </CardDescription>
          </div>
          <SyncStatusBadge status={isSyncing ? 'syncing' : repo.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 text-sm text-text-tertiary mb-4">
          {repo.language && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-indigo" aria-hidden="true" />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1 tabular-nums">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {repo.starsCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            {repo.isPrivate ? "Private" : "Public"}
          </span>
        </div>
        
        {/* Progress bar — only shows when actively syncing */}
        {isSyncing && (
          <div className="mb-3">
            {displayTotal > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs text-text-tertiary mb-1 tabular-nums">
                  <span>{displayCommits} / {displayTotal} commits</span>
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
              <>
                <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-brand-indigo h-1.5 rounded-full w-1/3 animate-pulse" />
                </div>
                <p className="text-xs text-text-tertiary mt-1">Discovering commits…</p>
              </>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <div className="text-text-tertiary tabular-nums">
            {displayCommits > 0 ? (
              <span>{displayCommits} commits synced</span>
            ) : (
              <span>No commits synced yet</span>
            )}
          </div>
          
          <div className="flex gap-2">
            {repo.status === "ready" && !isSyncing && (
              <>
                <Link href={`/dashboard/repos/${repo.id}/commits`}>
                  <Button variant="outline" size="sm" className="btn-linear-subtle">Commits</Button>
                </Link>
                <Link href={`/dashboard/repos/${repo.id}/releases`}>
                  <Button variant="outline" size="sm" className="btn-linear-subtle">Releases</Button>
                </Link>
                <Link href={`/dashboard/repos/${repo.id}/analytics`}>
                  <Button variant="outline" size="sm" className="btn-linear-subtle">Analytics</Button>
                </Link>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing || isSyncing}
              className="btn-linear-subtle"
            >
              {syncing ? "Syncing…" : "Sync"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="btn-linear-subtle text-destructive hover:text-destructive"
            >
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </div>
        </div>
        
        {repo.status === "error" && repo.errorMessage && (
          <div className="mt-2 p-2 bg-destructive/10 rounded-md border border-destructive/20">
            <p className="text-sm text-destructive">{repo.errorMessage}</p>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={`Remove ${repo.fullName}?`}
        description="This will delete all associated data including commits, releases, and analytics. This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Card>
  );
});
