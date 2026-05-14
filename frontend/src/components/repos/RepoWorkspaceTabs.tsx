"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface RepoWorkspaceTabsProps {
  repoId: string;
}

const tabs = [
  { label: "Overview", href: (id: string) => `/dashboard/repos/${id}`, match: "overview" },
  { label: "Commits", href: (id: string) => `/dashboard/repos/${id}/commits`, match: "commits" },
  { label: "Releases", href: (id: string) => `/dashboard/repos/${id}/releases`, match: "releases" },
  { label: "Analytics", href: (id: string) => `/dashboard/repos/${id}/analytics`, match: "analytics" },
];

export function RepoWorkspaceTabs({ repoId }: RepoWorkspaceTabsProps) {
  const pathname = usePathname();
  const overviewHref = `/dashboard/repos/${repoId}`;

  return (
    <nav aria-label="Repository workspace" className="flex gap-1 overflow-x-auto border-t border-border-subtle pt-3">
      {tabs.map((tab) => {
        const href = tab.href(repoId);
        const isActive = tab.match === "overview"
          ? pathname === overviewHref
          : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={tab.label}
            href={href}
            prefetch
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-surface-2 text-text-primary border border-border-standard"
                : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
