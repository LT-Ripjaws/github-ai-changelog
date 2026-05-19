"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getCommits, searchCommits } from "@/lib/api";
import type { Commit, SearchResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonCommitRow } from "@/components/ui/skeleton";
import { EmptyCommits, EmptySearch } from "@/components/ui/empty-state";
import SemanticSearchBar from "@/components/commits/SemanticSearchBar";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/format";

interface CommitsClientProps {
  repoId: string;
  initialData: { commits: Commit[]; meta: { page: number; totalPages: number; total: number } };
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

function shortMessage(message: string) {
  return message.split("\n")[0];
}

interface CommitRowProps {
  repoId: string;
  commit: Commit;
}

function CommitRow({ repoId, commit }: CommitRowProps) {
  return (
    <Link
      href={`/dashboard/repos/${repoId}/commits/${commit.sha}`}
      prefetch={false}
      className="block card-linear p-4 transition-colors hover:border-brand-indigo/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-text-tertiary">
              {commit.sha.slice(0, 7)}
            </code>
            {commit.category ? (
              <Badge variant="outline" className={`px-1.5 py-0 text-[10px] capitalize ${CATEGORY_COLORS[commit.category] || ""}`}>
                {commit.category}
              </Badge>
            ) : null}
            {commit.isMergeCommit ? (
              <Badge variant="outline" className="badge-linear-neutral px-1.5 py-0 text-[10px]">
                merge
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-sm font-medium text-text-primary">
            {truncate(shortMessage(commit.message), 120)}
          </p>
          {commit.aiChangelog ? (
            <p className="mt-1 truncate text-xs text-text-secondary">
              {truncate(commit.aiChangelog, 150)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1 whitespace-nowrap text-right text-xs text-text-tertiary tabular-nums">
          <span>{formatDate(commit.committedAt)}</span>
          <div className="flex gap-2">
            <span className="text-cat-feature">+{commit.additions}</span>
            <span className="text-cat-breaking">-{commit.deletions}</span>
            <span>{commit.filesChanged}f</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

interface SearchResultRowProps {
  repoId: string;
  result: SearchResult;
}

function SearchResultRow({ repoId, result }: SearchResultRowProps) {
  return (
    <Link
      href={`/dashboard/repos/${repoId}/commits/${result.sha}`}
      prefetch={false}
      className="block card-linear p-4 transition-colors hover:border-brand-indigo/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-text-tertiary">
              {result.sha.slice(0, 7)}
            </code>
            {result.category ? (
              <Badge variant="outline" className={`px-1.5 py-0 text-[10px] capitalize ${CATEGORY_COLORS[result.category] || ""}`}>
                {result.category}
              </Badge>
            ) : null}
            <span className="text-xs text-text-tertiary tabular-nums">
              {(result.similarity * 100).toFixed(1)}% match
            </span>
          </div>
          <p className="truncate text-sm font-medium text-text-primary">
            {truncate(shortMessage(result.message), 120)}
          </p>
          {result.aiChangelog ? (
            <p className="mt-1 truncate text-xs text-text-secondary">
              {truncate(result.aiChangelog, 150)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1 whitespace-nowrap text-right text-xs text-text-tertiary tabular-nums">
          <span>{formatDate(result.committedAt)}</span>
          <div className="flex gap-2">
            <span className="text-cat-feature">+{result.additions}</span>
            <span className="text-cat-breaking">-{result.deletions}</span>
            <span>{result.filesChanged}f</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CommitsClient({ repoId, initialData }: CommitsClientProps) {
  const [commits, setCommits] = useState<Commit[]>(initialData.commits);
  const [meta, setMeta] = useState(initialData.meta);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const resetSearchMode = useCallback((clearInput = false) => {
    setIsSearchMode(false);
    setSearchResults([]);
    setSubmittedSearchQuery("");
    setSearchError(null);
    if (clearInput) setSearchInput("");
  }, []);

  const fetchCommits = useCallback(async (
    p: number,
    cat: string,
    from: string,
    to: string,
    options: { showLoading?: boolean } = {},
  ) => {
    const showLoading = options.showLoading ?? true;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await getCommits(repoId, {
        page: p,
        limit: 20,
        ...(cat ? { category: cat } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      });
      setCommits(res.data);
      setMeta(res.meta);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to fetch commits"));
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    if (isSearchMode) return;

    const defaultView = page === 1 && !category && !fromDate && !toDate;
    void fetchCommits(page, category, fromDate, toDate, { showLoading: !defaultView });
  }, [category, fetchCommits, fromDate, isSearchMode, page, toDate]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true);
    setSearchError(null);
    setSubmittedSearchQuery(query);
    setIsSearchMode(true);
    setPage(1);

    try {
      const res = await searchCommits(repoId, query, 10);
      setSearchResults(res.results);
    } catch (err: unknown) {
      setSearchResults([]);
      setSearchError(getErrorMessage(err, "Search failed"));
    } finally {
      setSearchLoading(false);
    }
  }, [repoId]);

  const applyCategory = (nextCategory: string) => {
    setCategory(nextCategory);
    setPage(1);
    resetSearchMode(false);
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setPage(1);
    resetSearchMode(false);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    setPage(1);
    resetSearchMode(false);
  };

  const clearAllControls = () => {
    setCategory("");
    setFromDate("");
    setToDate("");
    setPage(1);
    resetSearchMode(true);
    setCommits(initialData.commits);
    setMeta(initialData.meta);
  };

  const hasActiveControls = Boolean(category || fromDate || toDate || isSearchMode || searchInput);

  return (
    <div className="space-y-6">
      <section className="card-linear p-4 space-y-4" aria-label="Commit controls">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <SemanticSearchBar
            value={searchInput}
            loading={searchLoading}
            onQueryChange={setSearchInput}
            onSearch={handleSearch}
          />

          <div className="flex flex-wrap items-end gap-2">
            <label className="space-y-1">
              <span className="block text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
                From
              </span>
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => handleFromDateChange(event.target.value)}
                aria-label="Filter commits from date"
                className="input-linear h-10 min-w-[150px]"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
                To
              </span>
              <Input
                type="date"
                value={toDate}
                onChange={(event) => handleToDateChange(event.target.value)}
                aria-label="Filter commits to date"
                className="input-linear h-10 min-w-[150px]"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              onClick={clearAllControls}
              disabled={!hasActiveControls}
              className="btn-linear-subtle h-10"
            >
              Clear filters
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter commits by category">
          <button
            type="button"
            aria-pressed={!category}
            onClick={() => applyCategory("")}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/60",
              !category
                ? "border-brand-indigo bg-brand-indigo text-white"
                : "border-border-standard bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary"
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={category === cat}
              onClick={() => applyCategory(cat)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/60",
                category === cat
                  ? CATEGORY_COLORS[cat]
                  : "border-border-standard bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {searchError ? (
          <p className="text-sm text-destructive" role="alert">
            {searchError}
          </p>
        ) : null}
      </section>

      {loading || searchLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <SkeletonCommitRow key={index} />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4" role="alert">
          <p className="text-destructive">{error}</p>
        </div>
      ) : null}

      {!loading && !searchLoading && !error ? (
        <>
          {isSearchMode ? (
            <section className="space-y-3" aria-live="polite">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-text-secondary">
                  Semantic results for <span className="font-medium text-text-primary">“{submittedSearchQuery}”</span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => resetSearchMode(true)}
                  className="btn-linear-subtle self-start sm:self-auto"
                >
                  Clear search
                </Button>
              </div>

              {searchResults.length === 0 ? (
                <EmptySearch query={submittedSearchQuery} />
              ) : (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <SearchResultRow key={result.id} repoId={repoId} result={result} />
                  ))}
                </div>
              )}
            </section>
          ) : commits.length === 0 ? (
            <EmptyCommits />
          ) : (
            <div className="space-y-2">
              {commits.map((commit) => (
                <CommitRow key={commit.id} repoId={repoId} commit={commit} />
              ))}
            </div>
          )}

          {!isSearchMode && meta.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-linear-subtle"
              >
                Previous
              </Button>
              <span className="text-sm text-text-tertiary tabular-nums">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-linear-subtle"
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
