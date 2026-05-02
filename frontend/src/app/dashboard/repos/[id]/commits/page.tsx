"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCommits, getRepo, searchCommits } from "@/lib/api";
import type { Commit, Repo, PaginatedResponse, SearchResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonCommitRow } from "@/components/ui/skeleton";
import { EmptyCommits, EmptySearch } from "@/components/ui/empty-state";
import SemanticSearchBar from "@/components/commits/SemanticSearchBar";

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

  // Semantic search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchLoading(true);
    setSearchError(null);
    setIsSearchMode(true);
    try {
      const res = await searchCommits(repoId, query, 10);
      setSearchResults(res.results);
    } catch (err: any) {
      setSearchError(err.response?.data?.message || "Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getRepo(repoId),
      getCommits(repoId, { page, limit: 20, ...(category ? { category } : {}) }),
    ])
      .then(([repoData, commitsRes]) => {
        setRepo(repoData);
        setCommits(commitsRes.data);
        setMeta(commitsRes.meta);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to fetch commits");
      })
      .finally(() => setLoading(false));
  }, [repoId, page, category]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const truncate = (s: string, len: number) =>
    s.length > len ? s.slice(0, len) + "\u2026" : s;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary mb-2">
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">Repositories</Link>
          <span aria-hidden="true">/</span>
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">{repo?.fullName || "..."}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-text-primary">Commits</span>
        </div>
        <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>
          Commits {meta.total > 0 && <span className="text-text-tertiary font-normal text-lg tabular-nums">({meta.total})</span>}
        </h1>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        <Badge
          variant="outline"
          className={`cursor-pointer transition-colors badge-linear-neutral ${!category ? "bg-brand-indigo text-white border-brand-indigo" : ""}`}
          onClick={() => { setCategory(""); setPage(1); setIsSearchMode(false); setSearchResults([]); }}
          role="button"
          aria-pressed={!category}
        >
          All
        </Badge>
        {CATEGORIES.map((cat) => (
          <Badge
            key={cat}
            variant="outline"
            className={`cursor-pointer transition-colors capitalize badge-linear-neutral ${category === cat ? CATEGORY_COLORS[cat] + " border" : ""}`}
            onClick={() => { setCategory(cat); setPage(1); setIsSearchMode(false); setSearchResults([]); }}
            role="button"
            aria-pressed={category === cat}
          >
            {cat}
          </Badge>
        ))}
        {isSearchMode && (
          <Badge
            variant="outline"
            className="cursor-pointer badge-linear-neutral bg-violet-600/15 text-violet-400 border-violet-500/30"
            onClick={() => { setIsSearchMode(false); setSearchResults([]); }}
            role="button"
          >
            Clear search
          </Badge>
        )}
      </div>

      {/* Semantic search */}
      <SemanticSearchBar
        repoId={repoId}
        onSearch={handleSearch}
        results={searchResults}
        loading={searchLoading}
        error={searchError}
      />

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <SkeletonCommitRow key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20" role="alert">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Commits list */}
      {!loading && !error && (
        <>
          {isSearchMode ? (
            searchResults.length === 0 ? (
              <EmptySearch query="your search" />
            ) : (
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <Link
                    key={result.id}
                    href={`/dashboard/repos/${repoId}/commits/${result.sha}`}
                    className="block card-linear p-4 hover:border-brand-indigo/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded font-mono text-text-tertiary">
                            {result.sha.slice(0, 7)}
                          </code>
                          {result.category && (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${CATEGORY_COLORS[result.category] || ""}`}>
                              {result.category}
                            </Badge>
                          )}
                          <span className="text-xs text-text-tertiary tabular-nums">
                            {(result.similarity * 100).toFixed(1)}% match
                          </span>
                        </div>
                        <p className="text-sm font-medium text-text-primary truncate">{truncate(result.message.split("\n")[0], 120)}</p>
                        {result.aiChangelog && (
                          <p className="text-xs text-text-secondary mt-1 truncate">{truncate(result.aiChangelog, 150)}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-text-tertiary whitespace-nowrap flex flex-col items-end gap-1 tabular-nums">
                        <span>{formatDate(result.committedAt)}</span>
                        <div className="flex gap-2">
                          <span className="text-emerald-400">+{result.additions}</span>
                          <span className="text-red-400">-{result.deletions}</span>
                          <span>{result.filesChanged}f</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            commits.length === 0 ? (
              <EmptyCommits />
            ) : (
              <div className="space-y-2">
                {commits.map((commit) => (
                  <Link
                    key={commit.id}
                    href={`/dashboard/repos/${repoId}/commits/${commit.sha}`}
                    className="block card-linear p-4 hover:border-brand-indigo/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded font-mono text-text-tertiary">
                            {commit.sha.slice(0, 7)}
                          </code>
                          {commit.category && (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${CATEGORY_COLORS[commit.category] || ""}`}>
                              {commit.category}
                            </Badge>
                          )}
                          {commit.isMergeCommit && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 badge-linear-neutral">merge</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-text-primary truncate">{truncate(commit.message.split("\n")[0], 120)}</p>
                        {commit.aiChangelog && (
                          <p className="text-xs text-text-secondary mt-1 truncate">{truncate(commit.aiChangelog, 150)}</p>
                        )}
                      </div>
                      <div className="text-right text-xs text-text-tertiary whitespace-nowrap flex flex-col items-end gap-1 tabular-nums">
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
            )
          )}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-linear-subtle">
                Previous
              </Button>
              <span className="text-sm text-text-tertiary tabular-nums">Page {meta.page} of {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)} className="btn-linear-subtle">
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
