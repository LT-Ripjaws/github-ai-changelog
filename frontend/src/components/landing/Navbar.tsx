"use client";
import Link from "next/link";
import { useTokenCheck } from "@/lib/hooks/useTokenCheck";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { hasToken, loading } = useTokenCheck();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-surface-0/80 backdrop-blur-xl shadow-lg shadow-black/30">
      <div className="flex items-center justify-between h-14 px-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-brand-indigo flex items-center justify-center transition-colors group-hover:bg-brand-hover">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M16 18l6-6-6-6" />
              <path d="M8 6l-6 6 6 6" />
            </svg>
          </div>
          <span className="text-base font-medium text-text-primary font-feature-settings-cv01-ss03 group-hover:text-brand-indigo transition-colors duration-200">RepoNarrate</span>
        </Link>
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-8 w-20 bg-muted rounded-md animate-pulse" />
          ) : hasToken ? (
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="btn-linear-ghost px-3 py-1.5 text-xs font-medium">
                Dashboard
              </Button>
            </Link>
          ) : (
            <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github`}>
              <Button variant="outline" size="sm" className="btn-linear-ghost px-3 py-1.5 text-xs font-medium">
                Sign in
              </Button>
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
