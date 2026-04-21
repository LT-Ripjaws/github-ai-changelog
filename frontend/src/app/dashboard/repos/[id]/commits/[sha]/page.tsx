"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCommit, getRepo } from "@/lib/api";
import type { Commit, Repo } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const CATEGORY_COLORS: Record<string, string> = {
  breaking: "bg-red-500/15 text-red-400 border-red-500/30",
  feature: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  fix: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  chore: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  docs: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  refactor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

export default function CommitDetailPage() {
  const params = useParams();
  const repoId = params.id as string;
  const sha = params.sha as string;

  const [repo, setRepo] = useState<Repo | null>(null);
  const [commit, setCommit] = useState<Commit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getRepo(repoId),
      getCommit(repoId, sha),
    ])
      .then(([repoData, commitData]) => {
        setRepo(repoData);
        setCommit(commitData);
      })
      .catch((err) => setError(err.response?.data?.message || "Commit not found"))
      .finally(() => setLoading(false));
  }, [repoId, sha]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error || !commit) {
    return (
      <div className="space-y-4">
        <Link href={`/dashboard/repos/${repoId}/commits`} className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to commits
        </Link>
        <div className="p-4 bg-destructive/10 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  const commitMessage = commit.message.split("\n");
  const title = commitMessage[0];
  const body = commitMessage.slice(1).join("\n").trim();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">Repositories</Link>
        <span>/</span>
        <Link href="/dashboard" className="hover:text-foreground transition-colors">{repo?.fullName || "..."}</Link>
        <span>/</span>
        <Link href={`/dashboard/repos/${repoId}/commits`} className="hover:text-foreground transition-colors">Commits</Link>
        <span>/</span>
        <code className="text-foreground bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{commit.sha.slice(0, 7)}</code>
      </div>

      {/* Header */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl font-bold">{title}</h1>
            {body && (
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{body}</pre>
            )}
          </div>
          {commit.category && (
            <Badge variant="outline" className={`capitalize shrink-0 ${CATEGORY_COLORS[commit.category] || ""}`}>
              {commit.category}
            </Badge>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span>{commit.authorName || commit.authorGithubLogin || "Unknown"}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatDate(commit.committedAt)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400">+{commit.additions}</span>
            <span className="text-red-400">-{commit.deletions}</span>
            <span>{commit.filesChanged} files changed</span>
          </div>
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{commit.sha}</code>
        </div>
      </div>

      {/* AI Changelog */}
      {commit.aiChangelog && (
        <div className="border rounded-lg p-6 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" /><circle cx="12" cy="14" r="2" />
            </svg>
            AI Changelog
          </h2>
          <p className="text-sm leading-relaxed">{commit.aiChangelog}</p>
        </div>
      )}

      {/* Diff Summary */}
      {commit.diffSummary && (
        <div className="border rounded-lg p-6 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            Diff Summary
          </h2>
          <pre className="text-xs leading-relaxed bg-muted/50 p-4 rounded-md overflow-x-auto font-mono whitespace-pre-wrap">{commit.diffSummary}</pre>
        </div>
      )}
    </div>
  );
}
