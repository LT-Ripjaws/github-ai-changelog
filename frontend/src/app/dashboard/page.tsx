"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RepoCard } from "@/components/repos/RepoCard";
import { ConnectRepoModal } from "@/components/repos/ConnectRepoModal";
import { getRepos, createRepo, syncRepo, deleteRepo, getRepoStatus } from "@/lib/api";
import type { Repo } from "@/lib/types";

export default function DashboardPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

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
    fetchRepos();
  }, []);

  const handleConnect = async (fullName: string) => {
    const newRepo = await createRepo(fullName);
    setRepos((prev) => [newRepo, ...prev]);
    // Poll until sync completes
    pollRepoUntilReady(newRepo.id);
  };

  const pollRepoUntilReady = async (repoId: string) => {
    const maxAttempts = 30; // 30 * 2s = 60s max
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const updated = await getRepoStatus(repoId);
        setRepos((prev) =>
          prev.map((r) => (r.id === repoId ? { ...r, ...updated } : r))
        );
        if (updated.status === 'ready' || updated.status === 'error') break;
      } catch {
        break;
      }
    }
  };

  const handleSync = async (id: string) => {
    await syncRepo(id);
    await fetchRepos();
    pollRepoUntilReady(id);
  };

  const handleDelete = async (id: string) => {
    await deleteRepo(id);
    setRepos((prev) => prev.filter((repo) => repo.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Repositories</h1>
          <Button disabled>Connect Repository</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Repositories</h1>
          <Button onClick={() => setShowConnectModal(true)}>
            Connect Repository
          </Button>
        </div>
        <div className="p-4 bg-destructive/10 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Repositories</h1>
          <p className="text-muted-foreground">
            Connect your GitHub repositories to generate AI changelogs
          </p>
        </div>
        <Button onClick={() => setShowConnectModal(true)}>
          Connect Repository
        </Button>
      </div>

      {repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-muted-foreground"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">No repositories connected</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Connect your first GitHub repository to start generating AI-powered
            changelogs and release notes.
          </p>
          <Button onClick={() => setShowConnectModal(true)}>
            Connect your first repository
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              onSync={handleSync}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ConnectRepoModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onSubmit={handleConnect}
      />
    </div>
  );
}
