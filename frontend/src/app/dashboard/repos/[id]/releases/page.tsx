"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getReleases, getRepo } from "@/lib/api";
import type { Release, Repo, PaginatedResponse } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    getRepo(repoId).then(setRepo).catch(() => {});
  }, [repoId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getReleases(repoId, { page, limit: 20 })
      .then((res) => {
        setReleases(res.data);
        setMeta(res.meta);
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Repositories</Link>
          <span>/</span>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">{repo?.fullName || "..."}</Link>
          <span>/</span>
          <span className="text-foreground">Releases</span>
        </div>
        <h1 className="text-2xl font-bold">
          Releases {meta.total > 0 && <span className="text-muted-foreground font-normal text-lg">({meta.total})</span>}
        </h1>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Releases list */}
      {!loading && !error && (
        <>
          {releases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 mb-4 opacity-50">
                <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" /><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" /><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
              </svg>
              <p>No releases found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {releases.map((release) => {
                const isOpen = expanded[release.id];
                return (
                  <div key={release.id} className="border rounded-lg overflow-hidden">
                    {/* Release header */}
                    <div
                      className="p-5 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleExpand(release.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{release.tagName}</h3>
                            {release.releaseName && (
                              <span className="text-muted-foreground">— {release.releaseName}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatDate(release.releasedAt)}</span>
                            <span>{release.commitsCount} commits</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {release.breakingChanges.length > 0 && (
                            <Badge className="bg-red-500/15 text-red-400 border-red-500/30">
                              {release.breakingChanges.length} breaking
                            </Badge>
                          )}
                          {release.features.length > 0 && (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                              {release.features.length} features
                            </Badge>
                          )}
                          {release.fixes.length > 0 && (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
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
                            className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isOpen && (
                      <div className="border-t p-5 space-y-4 bg-muted/30">
                        {/* AI Summary */}
                        {release.aiSummary && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">AI Summary</h4>
                            <p className="text-sm leading-relaxed">{release.aiSummary}</p>
                          </div>
                        )}

                        {/* Breaking Changes */}
                        {release.breakingChanges.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              Breaking Changes
                            </h4>
                            <ul className="space-y-1">
                              {release.breakingChanges.map((item, i) => (
                                <li key={i} className="text-sm pl-4 border-l-2 border-red-500/30">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Features */}
                        {release.features.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-emerald-400">Features</h4>
                            <ul className="space-y-1">
                              {release.features.map((item, i) => (
                                <li key={i} className="text-sm pl-4 border-l-2 border-emerald-500/30">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Fixes */}
                        {release.fixes.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-amber-400">Fixes</h4>
                            <ul className="space-y-1">
                              {release.fixes.map((item, i) => (
                                <li key={i} className="text-sm pl-4 border-l-2 border-amber-500/30">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Chores */}
                        {release.chores.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-slate-400">Chores</h4>
                            <ul className="space-y-1">
                              {release.chores.map((item, i) => (
                                <li key={i} className="text-sm pl-4 border-l-2 border-slate-500/30">{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Raw body fallback */}
                        {!release.aiSummary && release.rawBody && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Raw Notes</h4>
                            <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/50 p-4 rounded-md">{release.rawBody}</pre>
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
