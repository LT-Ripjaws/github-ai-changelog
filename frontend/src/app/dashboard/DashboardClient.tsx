"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { RepoCard } from "@/components/repos/RepoCard";
import { SkeletonRepoCard } from "@/components/ui/skeleton";
import { EmptyRepos } from "@/components/ui/empty-state";
import { createRepo, syncRepo, deleteRepo, getRepoStatus, getRepos } from "@/lib/api";
import type { Repo } from "@/lib/types";

const ConnectRepoModal = dynamic(
  () => import("@/components/repos/ConnectRepoModal").then((m) => m.ConnectRepoModal),
  { ssr: false }
);

interface DashboardClientProps {
  initialRepos: Repo[];
}

export default function DashboardClient({ initialRepos }: DashboardClientProps) {
  const [repos, setRepos] = useState<Repo[]>(initialRepos);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [syncingRepos, setSyncingRepos] = useState<Record<string, { synced: number; total: number }>>({});

  const fetchRepos = async () => {
    try {
      const data = await getRepos();
      setRepos(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch repositories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if initial data was empty (first visit after logout/re-login)
    if (initialRepos.length === 0) fetchRepos();
  }, []);

  const handleConnect = async (fullName: string) => {
    const newRepo = await createRepo(fullName);
    setRepos((prev) => [newRepo, ...prev]);
    pollRepoUntilReady(newRepo.id);
  };

  const pollRepoUntilReady = async (repoId: string) => {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const updated = await getRepoStatus(repoId);
        setRepos((prev) => prev.map((r) => (r.id === repoId ? { ...r, ...updated } : r)));
        setSyncingRepos((prev) => ({ ...prev, [repoId]: { synced: updated.totalCommitsSynced, total: updated.totalCommitsToSync } }));
        if (updated.status === 'ready' || updated.status === 'error') {
          await new Promise((r) => setTimeout(r, 1000));
          const final = await getRepoStatus(repoId);
          setRepos((prev) => prev.map((r) => (r.id === repoId ? { ...r, ...final } : r)));
          setSyncingRepos((prev) => { const next = { ...prev }; delete next[repoId]; return next; });
          break;
        }
      } catch {
        setSyncingRepos((prev) => { const next = { ...prev }; delete next[repoId]; return next; });
        break;
      }
    }
  };

  const handleSync = async (id: string) => {
    const repo = repos.find((item) => item.id === id);

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
      pollRepoUntilReady(id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to queue repository sync");
      setSyncingRepos((prev) => { const next = { ...prev }; delete next[id]; return next; });
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRepo(id);
    setRepos((prev) => prev.filter((repo) => repo.id !== id));
  };

  if (loading && initialRepos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-medium text-text-primary font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>Repositories</h1><p className="text-text-secondary mt-1">Loading your connected repositories...</p></div>
          <Button disabled className="btn-linear-primary opacity-50">Connect Repository</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => (<SkeletonRepoCard key={i} />))}</div>
      </div>
    );
  }

  if (error && repos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-medium text-text-primary font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>Repositories</h1><p className="text-text-secondary mt-1">Connect your GitHub repositories to generate AI changelogs</p></div>
          <Button onClick={() => setShowConnectModal(true)} className="btn-linear-primary">Connect Repository</Button>
        </div>
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20"><p className="text-destructive">{error}</p></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>Repositories</h1>
          <p className="text-text-secondary mt-1">Connect your GitHub repositories to generate AI changelogs</p>
        </div>
        <Button onClick={() => setShowConnectModal(true)} className="btn-linear-primary">Connect Repository</Button>
      </div>

      {repos.length === 0 ? (
        <EmptyRepos onConnect={() => setShowConnectModal(true)} />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} syncProgress={syncingRepos[repo.id] ?? null} onSync={handleSync} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <ConnectRepoModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} onSubmit={handleConnect} />
    </div>
  );
}
