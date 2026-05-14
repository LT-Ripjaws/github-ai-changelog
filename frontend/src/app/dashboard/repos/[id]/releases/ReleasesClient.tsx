"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getReleases } from "@/lib/api";
import type { Release } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonReleaseCard } from "@/components/ui/skeleton";
import { EmptyReleases } from "@/components/ui/empty-state";

interface ReleasesClientProps {
  repoId: string;
  initialData: { releases: Release[]; meta: { page: number; totalPages: number; total: number } };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ChangeSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "red" | "emerald" | "amber" | "slate";
}) {
  if (items.length === 0) return null;

  const toneClasses = {
    red: "text-red-400 border-red-500/30",
    emerald: "text-emerald-400 border-emerald-500/30",
    amber: "text-amber-400 border-amber-500/30",
    slate: "text-slate-400 border-slate-500/30",
  }[tone];

  const borderClass = toneClasses.split(" ")[1];

  return (
    <div className="space-y-2">
      <h4 className={`text-sm font-medium font-feature-settings-cv01-ss03 ${toneClasses.split(" ")[0]}`}>
        {title}
      </h4>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className={`border-l-2 pl-4 text-sm text-text-secondary ${borderClass}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReleasesClient({ repoId, initialData }: ReleasesClientProps) {
  const [releases, setReleases] = useState<Release[]>(initialData.releases);
  const [meta, setMeta] = useState(initialData.meta);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchReleases = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReleases(repoId, { page: p, limit: 20 });
      setReleases(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch releases");
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  useEffect(() => {
    if (page === 1) {
      setReleases(initialData.releases);
      setMeta(initialData.meta);
      return;
    }

    void fetchReleases(page);
  }, [fetchReleases, initialData.meta, initialData.releases, page]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <SkeletonReleaseCard key={index} />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4" role="alert">
          <p className="text-destructive">{error}</p>
        </div>
      ) : null}

      {!loading && !error ? (
        <>
          {releases.length === 0 ? (
            <EmptyReleases />
          ) : (
            <div className="space-y-4">
              {releases.map((release) => {
                const isOpen = expanded[release.id] ?? false;
                const detailHref = `/dashboard/repos/${repoId}/releases/${encodeURIComponent(release.tagName)}`;
                const panelId = `release-preview-${release.id}`;

                return (
                  <article key={release.id} className="card-linear overflow-hidden">
                    <header className="p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <Link
                              href={detailHref}
                              prefetch
                              className="text-lg font-medium text-text-primary transition-colors hover:text-brand-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/60 font-feature-settings-cv01-ss03"
                            >
                              {release.tagName}
                            </Link>
                            {release.releaseName ? (
                              <span className="text-sm text-text-tertiary">— {release.releaseName}</span>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
                            <span>{formatDate(release.releasedAt)}</span>
                            <span className="tabular-nums">{release.commitsCount} commits</span>
                          </div>
                          {release.aiSummary ? (
                            <p className="line-clamp-2 max-w-4xl text-sm leading-6 text-text-secondary">
                              {release.aiSummary}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {release.breakingChanges?.length > 0 ? (
                            <Badge className="border-red-500/30 bg-red-500/15 text-red-400 tabular-nums">
                              {release.breakingChanges.length} breaking
                            </Badge>
                          ) : null}
                          {release.features?.length > 0 ? (
                            <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-400 tabular-nums">
                              {release.features.length} features
                            </Badge>
                          ) : null}
                          {release.fixes?.length > 0 ? (
                            <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-400 tabular-nums">
                              {release.fixes.length} fixes
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </header>

                    <div className="flex flex-col gap-3 border-t border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-text-tertiary">
                        Use preview for a quick scan, or open the full release detail page.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm" className="btn-linear-subtle">
                          <Link href={detailHref} prefetch>
                            Open detail
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => toggleExpand(release.id)}
                          className="btn-linear-subtle"
                        >
                          {isOpen ? "Hide preview" : "Preview changes"}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            aria-hidden="true"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </Button>
                      </div>
                    </div>

                    {isOpen ? (
                      <div id={panelId} className="space-y-4 border-t border-border-subtle bg-surface-1 p-5">
                        {release.aiSummary ? (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
                              AI Summary
                            </h4>
                            <p className="text-sm leading-relaxed text-text-secondary">{release.aiSummary}</p>
                          </div>
                        ) : null}

                        <ChangeSection title="Breaking Changes" items={release.breakingChanges ?? []} tone="red" />
                        <ChangeSection title="Features" items={release.features ?? []} tone="emerald" />
                        <ChangeSection title="Fixes" items={release.fixes ?? []} tone="amber" />
                        <ChangeSection title="Chores" items={release.chores ?? []} tone="slate" />

                        {!release.aiSummary && release.rawBody ? (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
                              Raw Notes
                            </h4>
                            <pre className="whitespace-pre-wrap rounded-md bg-surface-2 p-4 font-sans text-sm text-text-secondary">
                              {release.rawBody}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          {meta.totalPages > 1 ? (
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
