import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RepoOverviewSnapshot } from "@/components/repos/RepoOverviewSnapshot";
import { getReleasesServer, getRepoServer } from "@/lib/server-api";
import type { PaginatedResponse, Release, Repo } from "@/lib/types";
import { formatDate } from "@/lib/format";

export default async function RepoOverviewPage({
  params,
}: {
  params: { id: string };
}) {
  const cookie = (await headers()).get("cookie") ?? null;

  let repo: Repo;
  try {
    repo = await getRepoServer(params.id, cookie);
  } catch {
    notFound();
  }

  let latestRelease: Release | null = null;
  try {
    const releases = await getReleasesServer(params.id, cookie, { page: 1, limit: 1 }) as PaginatedResponse<Release>;
    latestRelease = releases.data[0] ?? null;
  } catch {
    latestRelease = null;
  }

  const workspaceLinks = [
    {
      label: "Commits",
      href: `/dashboard/repos/${repo.id}/commits`,
      eyebrow: `${repo.totalCommitsSynced.toLocaleString()} indexed`,
      description: "Inspect commits, AI changelog entries, categories, and semantic search.",
    },
    {
      label: "Releases",
      href: `/dashboard/repos/${repo.id}/releases`,
      eyebrow: latestRelease ? `Latest: ${latestRelease.tagName}` : "No releases indexed",
      description: "Review generated release summaries and grouped change notes.",
    },
    {
      label: "Analytics",
      href: `/dashboard/repos/${repo.id}/analytics`,
      eyebrow: repo.status === "ready" ? "Charts ready" : "Sync first",
      description: "Track commit categories and delivery cadence across the repository.",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <RepoOverviewSnapshot initialRepo={repo} />

        <aside className="card-linear p-5 space-y-4 animate-fade-in-up animate-delay-100">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
              Latest release
            </p>
            {latestRelease ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/repos/${repo.id}/releases/${encodeURIComponent(latestRelease.tagName)}`}
                    prefetch
                    className="text-xl font-medium text-text-primary transition-colors hover:text-brand-indigo font-feature-settings-cv01-ss03"
                  >
                    {latestRelease.tagName}
                  </Link>
                  <span className="rounded-full border border-border-subtle bg-surface-2 px-2 py-0.5 text-xs text-text-tertiary tabular-nums">
                    {latestRelease.commitsCount} commits
                  </span>
                </div>
                {latestRelease.releaseName ? (
                  <p className="text-sm text-text-secondary">{latestRelease.releaseName}</p>
                ) : null}
                <p className="text-xs text-text-tertiary tabular-nums">
                  Released {formatDate(latestRelease.releasedAt, { withTime: true })}
                </p>
                {latestRelease.aiSummary ? (
                  <p className="line-clamp-4 text-sm leading-6 text-text-secondary">
                    {latestRelease.aiSummary}
                  </p>
                ) : (
                  <p className="text-sm leading-6 text-text-secondary">
                    Release is indexed. Open it to review raw notes and generated change groups.
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xl font-medium text-text-primary font-feature-settings-cv01-ss03">
                  No releases indexed yet
                </h3>
                <p className="text-sm leading-6 text-text-secondary">
                  Once this repository has GitHub releases, RepoNarrate will surface the latest summary here.
                </p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="card-linear p-5 space-y-4 animate-fade-in-up animate-delay-200">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
              Workspace map
            </p>
            <h2 className="mt-2 text-xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.24px" }}>
              Start with the right surface
            </h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {workspaceLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              prefetch
              className="group rounded-md border border-border-subtle bg-surface-2/40 p-4 transition-colors hover:border-brand-indigo/30 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/60"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-text-primary transition-colors group-hover:text-brand-indigo font-feature-settings-cv01-ss03">
                  {item.label}
                </h3>
                <span className="text-text-tertiary transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  →
                </span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
                {item.eyebrow}
              </p>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
