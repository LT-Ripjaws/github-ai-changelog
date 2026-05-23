import Link from "next/link";
import { RepoSyncControl } from "@/components/repos/RepoSyncControl";
import { RepoWorkspaceTabs } from "@/components/repos/RepoWorkspaceTabs";
import type { Repo } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface RepoWorkspaceHeaderProps {
  repo: Repo;
}

export function RepoWorkspaceHeader({ repo }: RepoWorkspaceHeaderProps) {
  const [owner] = repo.fullName.split("/");

  return (
    <section className="card-linear overflow-hidden animate-fade-in-up">
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-tertiary">
          <Link href="/dashboard" prefetch className="hover:text-text-primary transition-colors">
            Repositories
          </Link>
          <span aria-hidden="true">/</span>
          <span>{owner}</span>
          <span aria-hidden="true">/</span>
          <span className="break-all text-text-primary">{repo.name}</span>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="break-words font-feature-settings-cv01-ss03 text-2xl font-medium text-text-primary text-balance"
                style={{ letterSpacing: "-0.288px" }}
              >
                {repo.fullName}
              </h1>
              <span className="rounded-full border border-border-subtle bg-surface-2 px-2 py-0.5 text-xs text-text-tertiary">
                {repo.isPrivate ? "Private" : "Public"}
              </span>
            </div>

            <p className="max-w-3xl text-sm leading-6 text-text-secondary">
              {repo.description || "No repository description provided."}
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-tertiary">
              <span>
                Default branch: <code className="break-all rounded bg-surface-2 px-1.5 py-0.5 font-mono text-text-secondary">{repo.defaultBranch}</code>
              </span>
              <span className="tabular-nums">Stars: {repo.starsCount.toLocaleString()}</span>
              <span>Language: {repo.language || "—"}</span>
              <span>Last sync: {formatDate(repo.lastSyncedAt, { withTime: true, fallback: "Never synced" })}</span>
            </div>
          </div>

          <RepoSyncControl repoId={repo.id} initialRepo={repo} />
        </div>

        <RepoWorkspaceTabs repoId={repo.id} />
      </div>
    </section>
  );
}
