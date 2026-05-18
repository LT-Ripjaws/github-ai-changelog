"use client";

import { memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncStatusBadge } from "@/components/app/SyncStatusBadge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SyncProgress } from "@/components/repos/SyncProgress";
import type { Repo } from "@/lib/types";
import { safeErrorMessage } from '@/lib/errors';
import { formatDate } from "@/lib/format";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const overviewHref = `/dashboard/repos/${repo.id}`;
  const isSyncing = syncProgress !== null;
  const displayCommits = isSyncing ? syncProgress.synced : repo.totalCommitsSynced;
  const displayTotal = isSyncing ? syncProgress.total : repo.totalCommitsToSync || 0;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync(repo.id);
    } catch {
      // The dashboard surfaces this via its error banner; swallow here so the
      // click handler doesn't leak an unhandled promise rejection.
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = () => {
    setMenuOpen(false);
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
    <Card className="card-linear group overflow-visible animate-fade-in-up transition-colors">
      <Link
        href={overviewHref}
        prefetch
        aria-label={`Open ${repo.fullName} overview`}
        className="block rounded-t-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/60"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">
                <span className="truncate group-hover:text-brand-indigo transition-colors">{repo.fullName}</span>
                <span className="shrink-0 text-text-tertiary transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  →
                </span>
              </CardTitle>
              <CardDescription className="line-clamp-2 text-text-secondary">
                {repo.description || "No description"}
              </CardDescription>
            </div>
            <SyncStatusBadge status={isSyncing ? "syncing" : repo.status} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          <div className="flex flex-wrap gap-3 text-sm text-text-tertiary">
            {repo.language ? (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-brand-indigo" aria-hidden="true" />
                {repo.language}
              </span>
            ) : null}
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

          {isSyncing ? (
            <SyncProgress
              synced={displayCommits}
              total={displayTotal}
              unit="commits"
              pendingLabel="Discovering commits…"
            />
          ) : null}

          <div className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-4 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">Commits</p>
              <p className="mt-1 text-text-primary tabular-nums">
                {displayCommits > 0 ? displayCommits.toLocaleString() : "None yet"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">Last sync</p>
              <p className="mt-1 text-text-primary tabular-nums">{formatDate(repo.lastSyncedAt, { fallback: "Never synced" })}</p>
            </div>
          </div>

          {repo.status === "error" && repo.errorMessage ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2" role="alert">
              <p className="text-sm text-destructive">{safeErrorMessage(repo.errorMessage)}</p>
            </div>
          ) : null}
        </CardContent>
      </Link>

      <CardContent className="border-t border-border-subtle pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-xs text-text-tertiary">
            Open overview for commits, releases, and analytics.
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing || isSyncing}
              className="btn-linear-primary"
            >
              {syncing || isSyncing ? "Syncing…" : "Sync"}
            </Button>

            <div className="relative" ref={menuRef}>
              <Button
                variant="outline"
                size="sm"
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={`More actions for ${repo.fullName}`}
                onClick={() => setMenuOpen((open) => !open)}
                className="btn-linear-subtle px-2"
              >
                <span aria-hidden="true">•••</span>
              </Button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-border-standard bg-card p-1 shadow-xl shadow-black/30"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex w-full items-center rounded-sm px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deleting ? "Removing…" : "Remove repository"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
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
