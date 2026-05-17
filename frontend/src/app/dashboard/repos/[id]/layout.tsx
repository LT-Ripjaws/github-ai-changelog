import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { RepoWorkspaceHeader } from "@/components/repos/RepoWorkspaceHeader";
import { getRepoServer } from "@/lib/server-api";

export default async function RepoWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const cookie = (await headers()).get("cookie") ?? null;
  const { id } = params;

  let repo;
  try {
    repo = await getRepoServer(id, cookie);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <RepoWorkspaceHeader repo={repo} />
      {children}
    </div>
  );
}
