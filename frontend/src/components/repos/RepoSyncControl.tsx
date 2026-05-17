"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SyncStatusBadge } from "@/components/app/SyncStatusBadge";
import { getRepo, getRepoStatus, syncRepo } from "@/lib/api";
import type { Repo } from "@/lib/types";
import { safeErrorMessage } from '@/lib/errors';

interface RepoSyncControlProps {
  repoId: string;
  initialRepo: Repo;
}

export function RepoSyncControl({ repoId, initialRepo }: RepoSyncControlProps) {
  const [repo, setRepo] = useState<Repo>(initialRepo);
  const [syncing, setSyncing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const isSyncing = repo.status === "syncing" || syncing;
  const progressPercent = repo.totalCommitsToSync > 0
    ? Math.min(100, Math.round((repo.totalCommitsSynced / repo.totalCommitsToSync) * 100))
    : 0;

  const handleSync = useCallback(async () => {
    if (!mountedRef.current) return;
    setSyncing(true);
    try {
      await syncRepo(repoId);
      const maxAttempts = 60;

      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (!mountedRef.current) return;
        const updated = await getRepoStatus(repoId);
        if (!mountedRef.current) return;
        setRepo((prev) => ({ ...prev, ...updated }));
        if (updated.status === "ready" || updated.status === "error") break;
      }

      if (!mountedRef.current) return;
      const final = await getRepo(repoId);
      if (mountedRef.current) setRepo(final);
    } catch {
      // Keep the current repo state; the backend exposes detailed errors in status polling.
    } finally {
      if (mountedRef.current) setSyncing(false);
    }
  }, [repoId]);

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex items-center gap-3">
        <SyncStatusBadge status={isSyncing ? "syncing" : repo.status} />
        <Button onClick={handleSync} disabled={isSyncing} className="btn-linear-primary">
          {isSyncing ? "Syncing…" : "Sync Now"}
        </Button>
      </div>

      {isSyncing ? (
        <div className="w-full min-w-[180px] sm:w-56" aria-live="polite">
          {repo.totalCommitsToSync > 0 ? (
            <>
              <div className="mb-1 flex items-center justify-between text-xs text-text-tertiary tabular-nums">
                <span>{repo.totalCommitsSynced} / {repo.totalCommitsToSync}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className="h-1.5 rounded-full bg-brand-indigo transition-[width] duration-500"
                  style={{ width: `${progressPercent}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </>
          ) : (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
              <div className="h-1.5 w-1/3 rounded-full bg-brand-indigo animate-pulse" />
            </div>
          )}
        </div>
      ) : null}

      {repo.status === "error" && repo.errorMessage ? (
        <p className="max-w-xs text-right text-xs text-destructive" role="alert">
          {safeErrorMessage(repo.errorMessage)}
        </p>
      ) : null}
    </div>
  );
}
