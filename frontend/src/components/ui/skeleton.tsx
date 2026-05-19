"use client";

import { cn } from "@/lib/utils";

const CHART_SKELETON_HEIGHTS = ["42%", "68%", "55%", "82%", "47%", "73%", "60%"];

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "text" | "avatar" | "button";
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: "bg-surface-2 skeleton-shimmer",
    card: "bg-surface-2 skeleton-shimmer rounded-lg",
    text: "bg-surface-2 skeleton-shimmer rounded-sm",
    avatar: "bg-surface-2 skeleton-shimmer rounded-full",
    button: "bg-surface-2 skeleton-shimmer rounded-md",
  };

  return (
    <div
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  );
}

// Pre-built skeleton patterns for common use cases
function SkeletonRepoCard() {
  return (
    <div className="card-linear p-6 space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-5 w-1/3" />
        <Skeleton variant="button" className="h-6 w-16" />
      </div>
      <Skeleton variant="text" className="h-3 w-2/3" />
      <div className="flex items-center space-x-4 pt-2">
        <Skeleton variant="text" className="h-3 w-20" />
        <Skeleton variant="text" className="h-3 w-20" />
        <Skeleton variant="text" className="h-3 w-20" />
      </div>
    </div>
  );
}

function SkeletonCommitRow() {
  return (
    <div className="flex items-center space-x-4 p-4 animate-fade-in-up card-linear">
      <Skeleton variant="avatar" className="h-8 w-8" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-3 w-1/2" />
      </div>
      <Skeleton variant="text" className="h-3 w-16" />
    </div>
  );
}

function SkeletonReleaseCard() {
  return (
    <div className="card-linear p-6 space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-5 w-1/4" />
        <Skeleton variant="button" className="h-6 w-20" />
      </div>
      <Skeleton variant="text" className="h-3 w-full" />
      <Skeleton variant="text" className="h-3 w-5/6" />
      <div className="flex flex-wrap gap-2 pt-2">
        <Skeleton variant="button" className="h-6 w-16" />
        <Skeleton variant="button" className="h-6 w-20" />
        <Skeleton variant="button" className="h-6 w-18" />
      </div>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="card-linear p-6 animate-fade-in-up">
      <Skeleton variant="text" className="h-5 w-1/3 mb-4" />
      <div className="h-64 flex items-end space-x-2">
        {CHART_SKELETON_HEIGHTS.map((height, i) => (
          <Skeleton
            key={i}
            variant="default"
            className="flex-1 rounded-sm"
            style={{ height }}
          />
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonRepoCard,
  SkeletonCommitRow,
  SkeletonReleaseCard,
  SkeletonChart,
};
