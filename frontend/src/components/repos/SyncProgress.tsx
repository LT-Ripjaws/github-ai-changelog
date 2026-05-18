import { cn } from "@/lib/utils";

interface SyncProgressProps {
  synced: number;
  total: number;
  /** Suffix after "x / y" (e.g. "commits"). Omitted when not provided. */
  unit?: string;
  /** Caption under the indeterminate (unknown-total) bar. Omitted when absent. */
  pendingLabel?: string;
  /** Extra classes on the wrapper. */
  className?: string;
}

/**
 * Determinate/indeterminate sync progress bar. Server-compatible (no client
 * APIs) so the repo overview server component and the client cards/controls
 * all share one implementation instead of three near-identical copies.
 */
export function SyncProgress({ synced, total, unit, pendingLabel, className }: SyncProgressProps) {
  const percent = total > 0 ? Math.min(100, Math.round((synced / total) * 100)) : 0;

  return (
    <div className={cn(className)} aria-live="polite">
      {total > 0 ? (
        <>
          <div className="mb-1 flex items-center justify-between text-xs text-text-tertiary tabular-nums">
            <span>
              {synced} / {total}
              {unit ? ` ${unit}` : ""}
            </span>
            <span>{percent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-2">
            <div
              className="h-1.5 rounded-full bg-brand-indigo transition-[width] duration-500"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </>
      ) : (
        <>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-1.5 w-1/3 rounded-full bg-brand-indigo animate-pulse" />
          </div>
          {pendingLabel ? (
            <p className="mt-1 text-xs text-text-tertiary">{pendingLabel}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
