"use client";
import Link from "next/link";
import { useTokenCheck } from "@/lib/hooks/useTokenCheck";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navbar() {
  const { hasToken, loading } = useTokenCheck();

  return (
    <nav className="border-b border-border-subtle bg-surface-0/95 backdrop-blur supports-[backdrop-filter]:bg-surface-0/60">
      <div className="flex items-center justify-between h-16 px-6">
        <Link href="/" className="flex items-center space-x-2">
          <svg className="h-6 w-6 text-brand-indigo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" />
          </svg>
          <span className="text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">RepoNarrate</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {loading ? (
            <div className="h-9 w-24 bg-muted rounded-md animate-pulse" />
          ) : hasToken ? (
            <Link href="/dashboard">
              <Button variant="outline" className="btn-linear-ghost">
                Dashboard
              </Button>
            </Link>
          ) : (
            <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github`}>
              <Button variant="outline" className="btn-linear-ghost">
                Sign in
              </Button>
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
