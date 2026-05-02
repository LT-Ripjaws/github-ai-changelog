"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "card" | "text" | "avatar" | "button";
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  const variantClasses = {
    default: "bg-muted animate-pulse-subtle",
    card: "bg-muted animate-pulse-subtle rounded-md",
    text: "bg-muted animate-pulse-subtle rounded-sm",
    avatar: "bg-muted animate-pulse-subtle rounded-full",
    button: "bg-muted animate-pulse-subtle rounded",
  };

  return (
    <div
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  );
}

// Pre-built skeleton patterns for common use cases
function SkeletonCard() {
  return (
    <div className="card-linear p-6 space-y-4 animate-fade-in-up">
      <div className="flex items-center space-x-4">
        <Skeleton variant="avatar" className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="h-4 w-3/4" />
          <Skeleton variant="text" className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton variant="text" className="h-3 w-full" />
      <Skeleton variant="text" className="h-3 w-5/6" />
      <Skeleton variant="text" className="h-3 w-4/6" />
    </div>
  );
}

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
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            variant="default"
            className="flex-1 animate-pulse-subtle"
            style={{ height: `${Math.random() * 60 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonRepoCard,
  SkeletonCommitRow,
  SkeletonReleaseCard,
  SkeletonChart,
};
