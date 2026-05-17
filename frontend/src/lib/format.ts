/** Shared date formatter. Replaces ~7 near-identical local `formatDate`
 * helpers. Options reproduce each prior call site exactly. */
export function formatDate(
  value: string | null | undefined,
  opts?: { withTime?: boolean; withWeekday?: boolean; fallback?: string },
): string {
  if (!value) return opts?.fallback ?? "Never";
  return new Date(value).toLocaleDateString("en-US", {
    ...(opts?.withWeekday ? { weekday: "short" } : {}),
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(opts?.withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
