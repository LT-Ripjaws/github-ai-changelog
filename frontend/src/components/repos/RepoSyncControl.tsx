"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SyncStatusBadge } from "@/components/app/SyncStatusBadge";
import { SyncProgress } from "@/components/repos/SyncProgress";
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
  const pollTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Cancelable sleep so unmount cleanup can clear the pending timer instead of
  // letting the poll loop run an extra iteration after the component is gone.
  const sleep = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          pollTimeouts.current.delete(timer);
          resolve();
        }, ms);
        pollTimeouts.current.add(timer);
      }),
    [],
  );

  useEffect(() => {
    const timers = pollTimeouts.current;
    return () => {
      mountedRef.current = false;
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const isSyncing = repo.status === "syncing" || syncing;

  const handleSync = useCallback(async () => {
    if (!mountedRef.current) return;
    setSyncing(true);
    try {
      await syncRepo(repoId);
      const maxAttempts = 60;

      for (let i = 0; i < maxAttempts; i++) {
        await sleep(2000);
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
  }, [repoId, sleep]);

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex items-center gap-3">
        <SyncStatusBadge status={isSyncing ? "syncing" : repo.status} />
        <Button onClick={handleSync} disabled={isSyncing} className="btn-linear-primary">
          {isSyncing ? "Syncing…" : "Sync Now"}
        </Button>
      </div>

      {isSyncing ? (
        <SyncProgress
          synced={repo.totalCommitsSynced}
          total={repo.totalCommitsToSync}
          className="w-full min-w-[180px] sm:w-56"
        />
      ) : null}

      {repo.status === "error" && repo.errorMessage ? (
        <p className="max-w-xs text-right text-xs text-destructive" role="alert">
          {safeErrorMessage(repo.errorMessage)}
        </p>
      ) : null}
    </div>
  );
}
