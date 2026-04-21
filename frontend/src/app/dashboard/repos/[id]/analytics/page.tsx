"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRepo, getAnalytics } from "@/lib/api";
import type { Repo, Analytics } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CategoryPieChart from "@/components/analytics/CategoryPieChart";
import CommitsOverTimeChart from "@/components/analytics/CommitsOverTimeChart";

export default function AnalyticsPage() {
  const params = useParams();
  const repoId = params.id as string;

  const [repo, setRepo] = useState<Repo | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRepo(repoId).then(setRepo).catch(() => {});
  }, [repoId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getAnalytics(repoId)
      .then(setAnalytics)
      .catch((err) => setError(err.response?.data?.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [repoId]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Repositories</Link>
          <span>/</span>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">{repo?.fullName || "..."}</Link>
          <span>/</span>
          <span className="text-foreground">Analytics</span>
        </div>
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 rounded-lg">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {analytics && !loading && (
        <>
          {/* Summary card */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-zinc-400">Total Commits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{analytics.totalCommits}</p>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-400">Commits by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryPieChart data={analytics.commitsByCategory} />
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-400">Commits Over Time</CardTitle>
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
