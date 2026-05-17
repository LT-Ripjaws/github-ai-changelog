"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="card-linear max-w-md space-y-3 p-6">
        <h1 className="text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">
          Something went wrong
        </h1>
        <p className="text-sm text-text-secondary">
          An unexpected error occurred while rendering this page. You can try again, and if
          it keeps happening, head back to your dashboard.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Button onClick={reset} className="btn-linear-primary">
            Try again
          </Button>
          <Button
            variant="outline"
            className="btn-linear-ghost"
            onClick={() => {
              window.location.href = "/dashboard";
            }}
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
