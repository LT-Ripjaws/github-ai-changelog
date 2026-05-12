import { headers } from 'next/headers';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getAnalyticsServer, getRepoServer } from '@/lib/server-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkeletonChart } from '@/components/ui/skeleton';
import { EmptyAnalytics } from '@/components/ui/empty-state';

const CategoryPieChart = dynamic(
  () => import('@/components/analytics/CategoryPieChart'),
  { ssr: false, loading: () => <SkeletonChart /> }
);

const CommitsOverTimeChart = dynamic(
  () => import('@/components/analytics/CommitsOverTimeChart'),
  { ssr: false, loading: () => <SkeletonChart /> }
);

export default async function AnalyticsPage({
  params,
}: {
  params: { id: string };
}) {
  const cookie = (await headers()).get('cookie') ?? null;

  let repo: any;
  let analytics: any;
  try {
    [repo, analytics] = await Promise.all([
      getRepoServer(params.id, cookie),
      getAnalyticsServer(params.id, cookie),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-medium text-text-primary">Analytics</h1>
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20">
          <p className="text-destructive">Failed to load analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary mb-2">
          <Link href="/dashboard" className="hover:text-text-primary transition-colors" prefetch>Repositories</Link>
          <span>/</span>
          <Link href={`/dashboard/repos/${params.id}`} className="hover:text-text-primary transition-colors" prefetch>{repo?.fullName || "..."}</Link>
          <span>/</span>
          <span className="text-text-primary">Analytics</span>
        </div>
        <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>Analytics</h1>
      </div>

      {analytics.totalCommits === 0 ? (
        <EmptyAnalytics />
      ) : (
        <>
          {/* Summary card */}
          <Card className="card-linear animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-text-tertiary font-feature-settings-cv01-ss03">Total Commits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-medium text-text-primary tabular-nums font-feature-settings-cv01-ss03">{analytics.totalCommits}</p>
            </CardContent>
          </Card>

          {/* Charts — client-side via dynamic import */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-linear animate-fade-in-up animate-delay-100">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-text-tertiary font-feature-settings-cv01-ss03">Commits by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryPieChart data={analytics.commitsByCategory} />
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
