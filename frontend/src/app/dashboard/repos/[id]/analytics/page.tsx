import { headers } from "next/headers";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getAnalyticsServer } from "@/lib/server-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SkeletonChart } from "@/components/ui/skeleton";
import { EmptyAnalytics } from "@/components/ui/empty-state";

const CategoryBarChart = dynamic(
  () => import("@/components/analytics/CategoryBarChart"),
  { ssr: false, loading: () => <SkeletonChart /> }
);

const CommitsOverTimeChart = dynamic(
  () => import("@/components/analytics/CommitsOverTimeChart"),
  { ssr: false, loading: () => <SkeletonChart /> }
);

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function dateParam(value: string | string[] | undefined) {
  const candidate = firstParam(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : "";
}

function formatRange(from: string, to: string) {
  if (from && to) return `${from} → ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return "All time";
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string | string[]; to?: string | string[] };
}) {
  const cookie = (await headers()).get("cookie") ?? null;
  const { id } = params;
  const resolvedSearchParams = searchParams;
  const from = dateParam(resolvedSearchParams?.from);
  const to = dateParam(resolvedSearchParams?.to);
  const hasDateFilter = Boolean(from || to);

  let analytics;
  try {
    analytics = await getAnalyticsServer(id, cookie, {
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-medium text-text-primary">Analytics</h1>
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-destructive">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
            Repository telemetry
          </p>
          <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>
            Analytics
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Range: <span className="text-text-primary tabular-nums">{formatRange(from, to)}</span>
          </p>
        </div>

        <form method="get" className="card-linear flex flex-wrap items-end gap-3 p-4" aria-label="Filter analytics by date range">
          <label className="space-y-1">
            <span className="block text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
              From
            </span>
            <Input
              type="date"
              name="from"
              defaultValue={from}
              aria-label="Analytics from date"
              className="input-linear h-10 min-w-[150px]"
            />
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
              To
            </span>
            <Input
              type="date"
              name="to"
              defaultValue={to}
              aria-label="Analytics to date"
              className="input-linear h-10 min-w-[150px]"
            />
          </label>
          <Button type="submit" className="btn-linear-primary h-10">
            Apply range
          </Button>
          {hasDateFilter ? (
            <Button asChild variant="outline" className="btn-linear-subtle h-10">
              <Link href={`/dashboard/repos/${id}/analytics`} prefetch>
                Clear
              </Link>
            </Button>
          ) : null}
        </form>
      </div>

      {analytics.totalCommits === 0 ? (
        <EmptyAnalytics />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="card-linear animate-fade-in-up">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-tertiary font-feature-settings-cv01-ss03">Total Commits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-medium text-text-primary tabular-nums font-feature-settings-cv01-ss03">
                  {analytics.totalCommits.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="card-linear animate-fade-in-up animate-delay-100 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-tertiary font-feature-settings-cv01-ss03">Active Range</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-medium text-text-primary tabular-nums font-feature-settings-cv01-ss03">
                  {formatRange(from, to)}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Filters are applied server-side through the analytics API, keeping chart data aligned with the selected window.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="card-linear animate-fade-in-up animate-delay-100">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-tertiary font-feature-settings-cv01-ss03">Commits by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryBarChart data={analytics.commitsByCategory} />
              </CardContent>
            </Card>

            <Card className="card-linear animate-fade-in-up animate-delay-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-tertiary font-feature-settings-cv01-ss03">Commits Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <CommitsOverTimeChart data={analytics.commitsByMonth} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
