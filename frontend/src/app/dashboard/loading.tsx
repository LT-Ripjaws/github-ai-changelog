import { Skeleton } from "@/components/ui/skeleton";

// Scoped to the dashboard subtree: every dashboard/repo route does a
// `cache: 'no-store'` server fetch, so this streams a fallback instead of
// blocking on a blank screen during navigation.
export default function DashboardLoading() {
  return (
    <div className="min-w-0 space-y-6">
      <Skeleton variant="text" className="h-7 w-48" />
      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="card" className="h-44 w-full" />
        ))}
      </div>
    </div>
  );
}
