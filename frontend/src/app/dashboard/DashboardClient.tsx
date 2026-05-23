"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { RepoCard } from "@/components/repos/RepoCard";
import { SkeletonRepoCard } from "@/components/ui/skeleton";
import { EmptyRepos } from "@/components/ui/empty-state";
import { createRepo, syncRepo, deleteRepo, getRepoStatus, getRepos, subscribeRepoStatus } from "@/lib/api";
import { STATUS_TRANSPORT } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";
import type { Repo } from "@/lib/types";

const ConnectRepoModal = dynamic(
  () => import("@/components/repos/ConnectRepoModal").then((m) => m.ConnectRepoModal),
  { ssr: false }
);

interface DashboardClientProps {
  initialRepos: Repo[];
}

function isRepoInFlight(repo: Repo) {
  return repo.status === "pending" || repo.status === "syncing";
}

export default function DashboardClient({ initialRepos }: DashboardClientProps) {
  const [repos, setRepos] = useState<Repo[]>(initialRepos);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [syncingRepos, setSyncingRepos] = useState<Record<string, { synced: number; total: number }>>({});
  const mountedRef = useRef(true);
  const lifecycleRef = useRef(0);
  const activePollers = useRef<Map<string, number>>(new Map());
  const activeStreams = useRef<Map<string, EventSource>>(new Map());
  const pollTimeouts = useRef<Map<ReturnType<typeof setTimeout>, () => void>>(new Map());
  // Mirror of `repos` so the action callbacks don't close over state and can
  // stay referentially stable — otherwise RepoCard's memo() is defeated and
  // every card re-renders on every 2s poll tick.
  const reposRef = useRef(repos);
  useEffect(() => {
    reposRef.current = repos;
  }, [repos]);

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
    const pollers = activePollers.current;
    const streams = activeStreams.current;

    return () => {
      mountedRef.current = false;
      lifecycleRef.current += 1;
      timers.forEach((resolve, timer) => {
        clearTimeout(timer);
        resolve();
      });
      timers.clear();
      pollers.clear();
      streams.forEach((es) => es.close());
      streams.clear();
    };
  }, []);

  const fetchRepos = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const data = await getRepos();
      if (!mountedRef.current) return;
      setRepos(data);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const msg = getErrorMessage(err, 'Failed to fetch repositories');
      setError(msg);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch if initial data was empty (first visit after logout/re-login)
    if (initialRepos.length === 0) fetchRepos();
  }, [initialRepos.length, fetchRepos]);

  const pollRepoUntilReady = useCallback(async (repoId: string) => {
    if (activePollers.current.has(repoId)) return;
    const lifecycle = lifecycleRef.current;
    activePollers.current.set(repoId, lifecycle);
    const isCurrentLifecycle = () => mountedRef.current && lifecycleRef.current === lifecycle;
    let consecutiveFailures = 0;
    try {
      const maxAttempts = 150; // ~5 minutes at 2s intervals
      for (let i = 0; i < maxAttempts; i++) {
        if (!isCurrentLifecycle()) return;
        try {
          const updated = await getRepoStatus(repoId);
          consecutiveFailures = 0;
          if (!isCurrentLifecycle()) return;
          setRepos((prev) => prev.map((r) => (r.id === repoId ? { ...r, ...updated } : r)));
          setSyncingRepos((prev) => ({ ...prev, [repoId]: { synced: updated.totalCommitsSynced, total: updated.totalCommitsToSync } }));
          if (updated.status === 'ready' || updated.status === 'error') {
            await sleep(1000);
            if (!isCurrentLifecycle()) return;
            const final = await getRepoStatus(repoId);
            if (!isCurrentLifecycle()) return;
            setRepos((prev) => prev.map((r) => (r.id === repoId ? { ...r, ...final } : r)));
            setSyncingRepos((prev) => { const next = { ...prev }; delete next[repoId]; return next; });
            break;
          }
        } catch {
          consecutiveFailures += 1;
          if (!isCurrentLifecycle()) return;
          if (consecutiveFailures >= 5) {
            setSyncingRepos((prev) => { const next = { ...prev }; delete next[repoId]; return next; });
            break;
          }
        }
        await sleep(2000);
        if (!isCurrentLifecycle()) return;
      }
    } finally {
      if (activePollers.current.get(repoId) === lifecycle) {
        activePollers.current.delete(repoId);
      }
    }
  }, [sleep]);

  // Phase 4: prefer SSE; on any stream error fall back to polling automatically.
  const subscribeRepoSSE = useCallback((repoId: string) => {
    if (activeStreams.current.has(repoId) || activePollers.current.has(repoId)) return;
    let es: EventSource;
    try {
      es = subscribeRepoStatus(repoId);
    } catch {
      void pollRepoUntilReady(repoId);
      return;
    }
    activeStreams.current.set(repoId, es);
    const cleanup = () => {
      es.close();
      activeStreams.current.delete(repoId);
    };
    es.onmessage = (ev: MessageEvent) => {
      if (!mountedRef.current) {
        cleanup();
        return;
      }
      try {
        const updated = JSON.parse(ev.data);
        setRepos((prev) => prev.map((r) => (r.id === repoId ? { ...r, ...updated } : r)));
        setSyncingRepos((prev) => ({
          ...prev,
          [repoId]: { synced: updated.totalCommitsSynced, total: updated.totalCommitsToSync },
        }));
        if (updated.status === "ready" || updated.status === "error") {
          setSyncingRepos((prev) => { const next = { ...prev }; delete next[repoId]; return next; });
          cleanup();
        }
      } catch {
        // ignore malformed frames
      }
    };
    es.onerror = () => {
      cleanup();
      if (mountedRef.current) void pollRepoUntilReady(repoId); // automatic fallback
    };
  }, [pollRepoUntilReady]);

  const trackRepo = useCallback((repoId: string) => {
    if (STATUS_TRANSPORT === "sse") subscribeRepoSSE(repoId);
    else void pollRepoUntilReady(repoId);
  }, [subscribeRepoSSE, pollRepoUntilReady]);

  useEffect(() => {
    const resumeInFlightPollers = () => {
      for (const repo of reposRef.current) {
        if (isRepoInFlight(repo)) {
          trackRepo(repo.id);
        }
      }
    };

    resumeInFlightPollers();
    const interval = setInterval(resumeInFlightPollers, 2000);

    return () => clearInterval(interval);
  }, [trackRepo]);

  const handleConnect = useCallback(async (fullName: string) => {
    const newRepo = await createRepo(fullName);
    setRepos((prev) => [newRepo, ...prev]);
    trackRepo(newRepo.id);
  }, [trackRepo]);

  const handleSync = useCallback(async (id: string) => {
    const repo = reposRef.current.find((item) => item.id === id);

    setError(null);
    setRepos((prev) => prev.map((item) => (
      item.id === id ? { ...item, status: "syncing", errorMessage: null } : item
    )));
    setSyncingRepos((prev) => ({
      ...prev,
      [id]: {
        synced: repo?.totalCommitsSynced ?? 0,
        total: repo?.totalCommitsToSync ?? 0,
      },
    }));

    try {
      await syncRepo(id);
      trackRepo(id);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to queue repository sync');
      setError(msg);
      setSyncingRepos((prev) => { const next = { ...prev }; delete next[id]; return next; });
      throw err;
    }
  }, [trackRepo]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteRepo(id);
    setRepos((prev) => prev.filter((repo) => repo.id !== id));
  }, []);

  if (loading && initialRepos.length === 0) {
    return (
      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-medium text-text-primary font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>Repositories</h1><p className="text-text-secondary mt-1">Loading your connected repositories...</p></div>
          <Button disabled className="btn-linear-primary w-full opacity-50 sm:w-auto">Connect Repository</Button>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => (<SkeletonRepoCard key={i} />))}</div>
      </div>
    );
  }

  if (error && repos.length === 0) {
    return (
      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="text-2xl font-medium text-text-primary font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>Repositories</h1><p className="text-text-secondary mt-1">Connect your GitHub repositories to generate AI changelogs</p></div>
          <Button onClick={() => setShowConnectModal(true)} className="btn-linear-primary w-full sm:w-auto">Connect Repository</Button>
        </div>
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20"><p className="text-destructive">{error}</p></div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium text-text-primary font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>Repositories</h1>
          <p className="text-text-secondary mt-1">Connect your GitHub repositories to generate AI changelogs</p>
        </div>
        <Button onClick={() => setShowConnectModal(true)} className="btn-linear-primary w-full sm:w-auto">Connect Repository</Button>
      </div>

      {repos.length === 0 ? (
        <EmptyRepos onConnect={() => setShowConnectModal(true)} />
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} syncProgress={syncingRepos[repo.id] ?? null} onSync={handleSync} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <ConnectRepoModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} onSubmit={handleConnect} />
    </div>
  );
}
