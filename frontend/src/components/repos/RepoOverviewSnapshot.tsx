"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SyncStatusBadge } from "@/components/app/SyncStatusBadge";
import { SyncProgress } from "@/components/repos/SyncProgress";
import { getRepoStatus } from "@/lib/api";
import { safeErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import type { Repo } from "@/lib/types";

function statusCopy(repo: Repo) {
  switch (repo.status) {
    case "ready":
      return repo.totalCommitsSynced > 0
        ? "Repository intelligence is indexed and ready for review."
        : "Repository is connected and ready. Run a sync to build changelog intelligence.";
    case "syncing":
      return "Sync is currently indexing commits and refreshing release intelligence.";
    case "pending":
      return "Repository is queued for its first sync. Progress will appear as soon as ingestion starts.";
    case "error":
      return "The latest sync needs attention. Review the backend message below, then retry sync from the workspace header.";
    default:
      return "Repository status is being prepared.";
  }
}

/**
 * Client island for the overview "command center" card. The page is a server
 * component (renders once); this polls /status while the repo is syncing so the
 * commit count + progress update live instead of only on a manual refresh.
 * On completion it triggers a server refresh so the rest of the page
 * (latest release, workspace eyebrows) reconciles too.
 */
export function RepoOverviewSnapshot({ initialRepo }: { initialRepo: Repo }) {
  const router = useRouter();
  const [repo, setRepo] = useState<Repo>(initialRepo);
  const mountedRef = useRef(true);
  const refreshedRef = useRef(false);

  // Pick up fresh server data (e.g. after router.refresh on completion) — but
  // never let a stale server snapshot taken mid-sync rewind the live progress
  // the local poller has already advanced past.
  useEffect(() => {
    setRepo((prev) => {
      const serverMidSync =
        initialRepo.status === "syncing" || initialRepo.status === "pending";
      if (
        serverMidSync &&
        prev.status === "syncing" &&
        initialRepo.totalCommitsSynced < prev.totalCommitsSynced
      ) {
        return prev;
      }
      return initialRepo;
    });
  }, [initialRepo]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (repo.status !== "syncing" && repo.status !== "pending") return;

    let cancelled = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(() => {
          timers.delete(t);
          resolve();
        }, ms);
        timers.add(t);
      });

    (async () => {
      // ~5 min ceiling. Transient failures (dev-server recompile mid-sync,
      // brief 5xx) never permanently stop the live view — it self-heals once
      // the backend responds again, since the sync continues server-side.
      const maxAttempts = 150;
      for (let i = 0; i < maxAttempts; i++) {
        if (cancelled || !mountedRef.current) return;
        let updated;
        try {
          updated = await getRepoStatus(repo.id);
        } catch {
          await sleep(2000);
          continue;
        }
        if (cancelled || !mountedRef.current) return;
        setRepo((prev) => ({ ...prev, ...updated }));
        if (updated.status === "ready" || updated.status === "error") {
          if (!refreshedRef.current) {
            refreshedRef.current = true;
            router.refresh();
          }
          return;
        }
        // Poll first, then wait — first update arrives immediately.
        await sleep(2000);
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [repo.status, repo.id, router]);

  return (
    <div className="card-linear p-5 space-y-5 animate-fade-in-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
            Command center
          </p>
          <h2 className="text-xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.24px" }}>
            Repository intelligence snapshot
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-text-secondary">
            {statusCopy(repo)}
          </p>
        </div>
        <SyncStatusBadge status={repo.status} />
      </div>

      {(repo.status === "syncing" || repo.status === "pending") ? (
        <SyncProgress
          synced={repo.totalCommitsSynced}
          total={repo.totalCommitsToSync}
          unit="commits"
          pendingLabel="Waiting for commit discovery…"
        />
      ) : null}

      {repo.status === "error" && repo.errorMessage ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3" role="alert">
          <p className="text-sm text-destructive">{safeErrorMessage(repo.errorMessage)}</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Commits indexed", value: repo.totalCommitsSynced.toLocaleString() },
          { label: "Last synced", value: formatDate(repo.lastSyncedAt, { withTime: true }), compact: true },
          { label: "Default branch", value: repo.defaultBranch, code: true },
          { label: "Visibility", value: repo.isPrivate ? "Private" : "Public" },
        ].map((stat) => (
          <div key={stat.label} className="min-w-0 rounded-md border border-border-subtle bg-surface-2/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
              {stat.label}
            </p>
            {stat.code ? (
              <code className="mt-2 inline-block break-all rounded bg-card px-2 py-1 font-mono text-sm text-text-primary">
                {stat.value}
              </code>
            ) : (
              <p className={`${stat.compact ? "text-sm" : "text-2xl"} mt-2 font-medium text-text-primary tabular-nums font-feature-settings-cv01-ss03`}>
                {stat.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
