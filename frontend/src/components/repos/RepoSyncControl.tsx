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
  const lifecycleRef = useRef(0);
  const pollTimeouts = useRef<Map<ReturnType<typeof setTimeout>, () => void>>(new Map());

  const sleep = useCallback(
    (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(() => {
          pollTimeouts.current.delete(timer);
          resolve();
        }, ms);
        pollTimeouts.current.set(timer, resolve);
      }),
    [],
  );

  useEffect(() => {
    mountedRef.current = true;
    lifecycleRef.current += 1;

    const timers = pollTimeouts.current;

    return () => {
      mountedRef.current = false;
      lifecycleRef.current += 1;
      timers.forEach((resolve, timer) => {
        clearTimeout(timer);
        resolve();
      });
      timers.clear();
    };
  }, []);

  const isSyncing = repo.status === "syncing" || repo.status === "pending" || syncing;

  // Poll until the repo finishes syncing. Shared by handleSync and the
  // auto-resume effect so the progress bar always updates in real time.
  const pollUntilDone = useCallback(async (token: number) => {
    const maxAttempts = 150; // ~5 minutes at 2s intervals

    for (let i = 0; i < maxAttempts; i++) {
      await sleep(2000);
      if (!mountedRef.current || lifecycleRef.current !== token) return;
      const updated = await getRepoStatus(repoId);
      if (!mountedRef.current || lifecycleRef.current !== token) return;
      setRepo((prev) => ({ ...prev, ...updated }));
      if (updated.status === "ready" || updated.status === "error") break;
    }

    if (!mountedRef.current || lifecycleRef.current !== token) return;
    const final = await getRepo(repoId);
    if (mountedRef.current && lifecycleRef.current === token) setRepo(final);
  }, [repoId, sleep]);

  // Auto-resume polling if the repo is already syncing when the page loads
  useEffect(() => {
    if (initialRepo.status === "syncing" || initialRepo.status === "pending") {
      const token = lifecycleRef.current;
      setSyncing(true);
      pollUntilDone(token).finally(() => {
        if (mountedRef.current && lifecycleRef.current === token) setSyncing(false);
      });
    }
  }, [initialRepo.status, pollUntilDone]);

  const handleSync = useCallback(async () => {
    if (!mountedRef.current) return;
    const token = lifecycleRef.current;
    setSyncing(true);
    try {
      await syncRepo(repoId);
      await pollUntilDone(token);
    } catch {
      // Keep the current repo state; the backend exposes detailed errors in status polling.
    } finally {
      if (mountedRef.current && lifecycleRef.current === token) setSyncing(false);
    }
  }, [repoId, pollUntilDone]);

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <SyncStatusBadge status={isSyncing ? "syncing" : repo.status} />
        <Button onClick={handleSync} disabled={isSyncing} className="btn-linear-primary min-w-24 flex-1 sm:flex-none">
          {isSyncing ? "Syncing…" : "Sync Now"}
        </Button>
      </div>

      {isSyncing ? (
        <SyncProgress
          synced={repo.totalCommitsSynced}
          total={repo.totalCommitsToSync}
          className="w-full sm:w-56"
        />
      ) : null}

      {repo.status === "error" && repo.errorMessage ? (
        <p className="max-w-full text-left text-xs text-destructive sm:max-w-xs sm:text-right" role="alert">
          {safeErrorMessage(repo.errorMessage)}
        </p>
      ) : null}
    </div>
  );
}
