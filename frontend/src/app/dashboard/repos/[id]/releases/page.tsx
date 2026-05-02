"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getReleases, getRepo } from "@/lib/api";
import type { Release, Repo, PaginatedResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonReleaseCard } from "@/components/ui/skeleton";
import { EmptyReleases } from "@/components/ui/empty-state";

export default function ReleasesPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [repo, setRepo] = useState<Repo | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getRepo(repoId),
      getReleases(repoId, { page, limit: 20 }),
    ])
      .then(([repoData, releasesRes]) => {
        setRepo(repoData);
        setReleases(releasesRes.data);
        setMeta(releasesRes.meta);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to fetch releases");
      })
      .finally(() => setLoading(false));
  }, [repoId, page]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary mb-2">
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">Repositories</Link>
          <span aria-hidden="true">/</span>
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">{repo?.fullName || "..."}</Link>
          <span aria-hidden="true">/</span>
          <span className="text-text-primary">Releases</span>
        </div>
        <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>
          Releases {meta.total > 0 && <span className="text-text-tertiary font-normal text-lg tabular-nums">({meta.total})</span>}
        </h1>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonReleaseCard key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20" role="alert">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Releases list */}
      {!loading && !error && (
        <>
          {releases.length === 0 ? (
            <EmptyReleases />
          ) : (
            <div className="space-y-4">
              {releases.map((release) => {
                const isOpen = expanded[release.id];
                return (
                  <div key={release.id} className="card-linear overflow-hidden">
                    {/* Release header */}
                    <div
                      className="p-5 cursor-pointer hover:bg-surface-2 transition-colors"
                      onClick={() => toggleExpand(release.id)}
                      role="button"
                      aria-expanded={isOpen}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleExpand(release.id); } }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/dashboard/repos/${repoId}/releases/${encodeURIComponent(release.tagName)}`}
                              className="text-lg font-medium text-text-primary hover:text-brand-indigo transition-colors font-feature-settings-cv01-ss03"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {release.tagName}
                            </Link>
                            {release.releaseName && (
                              <span className="text-text-tertiary">— {release.releaseName}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-text-tertiary">
                            <span>{formatDate(release.releasedAt)}</span>
                            <span className="tabular-nums">{release.commitsCount} commits</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {release.breakingChanges.length > 0 && (
                            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 tabular-nums">
                              {release.breakingChanges.length} breaking
                            </Badge>
                          )}
                          {release.features.length > 0 && (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 tabular-nums">
                              {release.features.length} features
                            </Badge>
                          )}
                          {release.fixes.length > 0 && (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 tabular-nums">
                              {release.fixes.length} fixes
                            </Badge>
                          )}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-4 w-4 text-text-tertiary transition-transform ${isOpen ? "rotate-180" : ""}`}
                            aria-hidden="true"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isOpen && (
                      <div className="border-t border-border-subtle p-5 space-y-4 bg-surface-1">
                        {/* AI Summary */}
                        {release.aiSummary && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-text-tertiary uppercase tracking-wide font-feature-settings-cv01-ss03">AI Summary</h4>
                            <p className="text-sm leading-relaxed text-text-secondary">{release.aiSummary}</p>
                          </div>
                        )}

                        {/* Breaking Changes */}
                        {release.breakingChanges.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-red-400 flex items-center gap-2 font-feature-settings-cv01-ss03">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              Breaking Changes
                            </h4>
                            <ul className="space-y-1">
                              {release.breakingChanges.map((item, i) => (
                                <li key={i} className="text-sm pl-4 border-l-2 border-red-500/30 text-text-secondary">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Features */}
                        {release.features.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-emerald-400 font-feature-settings-cv01-ss03">Features</h4>
                            <ul className="space-y-1">
                              {release.features.map((item, i) => (
                                <li key={i} className="text-sm pl-4 border-l-2 border-emerald-500/30 text-text-secondary">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Fixes */}
                        {release.fixes.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-amber-400 font-feature-settings-cv01-ss03">Fixes</h4>
                            <ul className="space-y-1">
                              {release.fixes.map((item, i) => (
                                <li key={i} className="text-sm pl-4 border-l-2 border-amber-500/30 text-text-secondary">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Chores */}
                        {release.chores.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-slate-400 font-feature-settings-cv01-ss03">Chores</h4>
                            <ul className="space-y-1">
                              {release.chores.map((item, i) => (
                                <li key={i} className="text-sm pl-4 border-l-2 border-slate-500/30 text-text-secondary">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Raw body fallback */}
                        {!release.aiSummary && release.rawBody && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-text-tertiary uppercase tracking-wide font-feature-settings-cv01-ss03">Raw Notes</h4>
                            <pre className="text-sm whitespace-pre-wrap font-sans bg-surface-2 p-4 rounded-md text-text-secondary">{release.rawBody}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
