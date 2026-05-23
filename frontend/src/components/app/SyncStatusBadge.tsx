"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SyncStatusBadgeProps {
  status: "pending" | "syncing" | "ready" | "error";
}

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const config = {
    pending: {
      label: "Pending",
      className: "border-border-standard bg-surface-2 text-text-secondary",
      dotClassName: "bg-text-tertiary",
    },
    syncing: {
      label: "Syncing",
      className: "border-brand-indigo/25 bg-brand-indigo/10 text-brand-indigo",
      dotClassName: "animate-pulse bg-brand-indigo",
    },
    ready: {
      label: "Ready",
      className: "border-success-emerald/25 bg-success-emerald/10 text-success-emerald",
      dotClassName: "bg-success-emerald",
    },
    error: {
      label: "Error",
      className: "border-destructive/25 bg-destructive/10 text-destructive",
      dotClassName: "bg-destructive",
    },
  }[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium leading-none",
        config.className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dotClassName)}
        aria-hidden="true"
      />
      {config.label}
    </Badge>
  );
}
