import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="card-linear max-w-md space-y-3 p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary font-feature-settings-cv01-ss03">
          404
        </p>
        <h1 className="text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">
          Page not found
        </h1>
        <p className="text-sm text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or you no longer have access
          to it.
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Button asChild className="btn-linear-primary">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="btn-linear-ghost">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
