"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getRepo, getAnalytics } from "@/lib/api";
import type { Repo, Analytics } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonChart } from "@/components/ui/skeleton";
import { EmptyAnalytics } from "@/components/ui/empty-state";

const CategoryPieChart = dynamic(
  () => import("@/components/analytics/CategoryPieChart"),
  { ssr: false, loading: () => <SkeletonChart /> }
);

const CommitsOverTimeChart = dynamic(
  () => import("@/components/analytics/CommitsOverTimeChart"),
  { ssr: false, loading: () => <SkeletonChart /> }
);

export default function AnalyticsPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [repo, setRepo] = useState<Repo | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getRepo(repoId),
      getAnalytics(repoId),
    ])
      .then(([repoData, analyticsData]) => {
        setRepo(repoData);
        setAnalytics(analyticsData);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [repoId]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary mb-2">
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">Repositories</Link>
          <span>/</span>
          <Link href="/dashboard" className="hover:text-text-primary transition-colors">{repo?.fullName || "..."}</Link>
          <span>/</span>
          <span className="text-text-primary">Analytics</span>
        </div>
        <h1 className="text-2xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>Analytics</h1>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 rounded-md border border-destructive/20">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {analytics && !loading && (
        <>
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

              {/* Charts */}
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
        </>
      )}
    </div>
  );
}
