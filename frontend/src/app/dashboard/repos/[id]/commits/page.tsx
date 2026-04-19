"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCommits, getRepo } from "@/lib/api";
import type { Commit, Repo, PaginatedResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS: Record<string, string> = {
  breaking: "bg-red-500/15 text-red-400 border-red-500/30",
  feature: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  fix: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  chore: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  docs: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  refactor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const CATEGORIES = ["breaking", "feature", "fix", "chore", "docs", "refactor"];

export default function CommitsPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [repo, setRepo] = useState<Repo | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getRepo(repoId).then(setRepo).catch(() => {});
  }, [repoId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCommits(repoId, { page, limit: 20, ...(category ? { category } : {}) })
      .then((res) => {
        setCommits(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to fetch commits");
      })
      .finally(() => setLoading(false));
  }, [repoId, page, category]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const truncate = (s: string, len: number) =>
    s.length > len ? s.slice(0, len) + "..." : s;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Repositories</Link>
          <span>/</span>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">{repo?.fullName || "..."}</Link>
          <span>/</span>
          <span className="text-foreground">Commits</span>
        </div>
        <h1 className="text-2xl font-bold">
          Commits {meta.total > 0 && <span className="text-muted-foreground font-normal text-lg">({meta.total})</span>}
        </h1>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={`cursor-pointer transition-all ${!category ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}
          onClick={() => { setCategory(""); setPage(1); }}
        >
          All
        </Badge>
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant="outline"
            className={`cursor-pointer transition-all capitalize ${category === cat ? CATEGORY_COLORS[cat] + " border" : "hover:bg-accent"}`}
            onClick={() => { setCategory(cat); setPage(1); }}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Commits list */}
      {!loading && !error && (
        <>
          {commits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 mb-4 opacity-50">
                <circle cx="12" cy="12" r="3" /><line x1="3" y1="12" x2="9" y2="12" /><line x1="15" y1="12" x2="21" y2="12" />
              </svg>
              <p>No commits found{category ? ` in "${category}" category` : ""}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {commits.map((commit) => (
                <Link
                  key={commit.id}
                  href={`/dashboard/repos/${repoId}/commits/${commit.sha}`}
                  className="block border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                          {commit.sha.slice(0, 7)}
                        </code>
                        {commit.category && (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${CATEGORY_COLORS[commit.category] || ""}`}>
                            {commit.category}
                          </Badge>
                        )}
                        {commit.isMergeCommit && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">merge</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{truncate(commit.message.split("\n")[0], 120)}</p>
                      {commit.aiChangelog && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{truncate(commit.aiChangelog, 150)}</p>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap flex flex-col items-end gap-1">
                      <span>{formatDate(commit.committedAt)}</span>
                      <div className="flex gap-2">
                        <span className="text-emerald-400">+{commit.additions}</span>
                        <span className="text-red-400">-{commit.deletions}</span>
                        <span>{commit.filesChanged}f</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
