"use client";

import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-text-tertiary">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-text-primary mb-2 font-feature-settings-cv01-ss03">
        {title}
      </h3>
      <p className="text-text-secondary mb-6 max-w-md">
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          className="btn-linear-primary"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-built empty states for common scenarios
function EmptyRepos({ onConnect }: { onConnect: () => void }) {
  return (
    <EmptyState
      title="No repositories connected"
      description="Connect a GitHub repository to start generating AI-powered changelogs"
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      }
      action={{
        label: "Connect Repository",
        onClick: onConnect,
      }}
    />
  );
}

function EmptyCommits() {
  return (
    <EmptyState
      title="No commits found"
      description="Commits will appear here after your repository sync completes"
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      }
    />
  );
}

function EmptyReleases() {
  return (
    <EmptyState
      title="No releases found"
      description="Releases will be detected and summarized once your repository has GitHub releases"
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      }
    />
  );
}

function EmptyAnalytics() {
  return (
    <EmptyState
      title="No analytics data"
      description="Analytics will appear once you have enough commit history"
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      }
    />
  );
}

function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      title={`No results for "${query}"`}
      description="Try adjusting your search terms or clearing filters"
      icon={
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
    />
  );
}

export {
  EmptyState,
  EmptyRepos,
  EmptyCommits,
  EmptyReleases,
  EmptyAnalytics,
  EmptySearch,
};
