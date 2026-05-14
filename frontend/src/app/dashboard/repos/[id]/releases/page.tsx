import { headers } from "next/headers";
import { getReleasesServer } from "@/lib/server-api";
import ReleasesClient from "./ReleasesClient";

export default async function ReleasesPage({
  params,
}: {
  params: { id: string };
}) {
  const cookie = (await headers()).get("cookie") ?? null;

  let releasesData;
  try {
    releasesData = await getReleasesServer(params.id, cookie, { page: 1, limit: 20 });
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-medium text-text-primary">Releases</h1>
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20">
          <p className="text-destructive">Failed to load releases</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
          Release notes
        </p>
        <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>
          Releases {releasesData.meta?.total > 0 ? <span className="text-text-tertiary font-normal text-lg tabular-nums">({releasesData.meta.total})</span> : null}
        </h1>
      </div>

      <ReleasesClient
        key={params.id}
        repoId={params.id}
        initialData={{ releases: releasesData.data, meta: releasesData.meta }}
      />
    </div>
  );
}
