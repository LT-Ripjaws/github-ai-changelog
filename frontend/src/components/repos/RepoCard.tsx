"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncStatusBadge } from "@/components/app/SyncStatusBadge";
import type { Repo } from "@/lib/types";

interface RepoCardProps {
  repo: Repo;
  onSync: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function RepoCard({ repo, onSync, onDelete }: RepoCardProps) {
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await onSync(repo.id);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${repo.fullName}? This will delete all associated data.`)) {
      return;
    }
    
    setDeleting(true);
    try {
      await onDelete(repo.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{repo.fullName}</CardTitle>
            <CardDescription className="line-clamp-2">
              {repo.description || "No description"}
            </CardDescription>
          </div>
          <SyncStatusBadge status={repo.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mb-4">
          {repo.language && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {repo.starsCount.toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            {repo.isPrivate ? "Private" : "Public"}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            {repo.totalCommitsSynced > 0 ? (
              <span>{repo.totalCommitsSynced} commits synced</span>
            ) : (
              <span>No commits synced yet</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing || repo.status === "syncing"}
            >
              {syncing ? "Syncing..." : "Sync"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              {deleting ? "Removing..." : "Remove"}
            </Button>
          </div>
        </div>
        
        {repo.status === "error" && repo.errorMessage && (
          <div className="mt-2 p-2 bg-destructive/10 rounded-md">
            <p className="text-sm text-destructive">{repo.errorMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
