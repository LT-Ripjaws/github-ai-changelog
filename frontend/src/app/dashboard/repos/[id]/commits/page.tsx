import { headers } from "next/headers";
import { getCommitsServer } from "@/lib/server-api";
import CommitsClient from "./CommitsClient";

export default async function CommitsPage({
  params,
}: {
  params: { id: string };
}) {
  const cookie = (await headers()).get("cookie") ?? null;
  const { id } = params;

  let commitsData;
  try {
    commitsData = await getCommitsServer(id, cookie, { page: 1, limit: 20 });
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-medium text-text-primary">Commits</h1>
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20">
          <p className="text-destructive">Failed to load commits</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
          Commit intelligence
        </p>
        <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>
          Commits {commitsData.meta?.total > 0 ? <span className="text-text-tertiary font-normal text-lg tabular-nums">({commitsData.meta.total})</span> : null}
        </h1>
      </div>

      <CommitsClient
        key={id}
        repoId={id}
        initialData={{ commits: commitsData.data, meta: commitsData.meta }}
      />
    </div>
  );
}
