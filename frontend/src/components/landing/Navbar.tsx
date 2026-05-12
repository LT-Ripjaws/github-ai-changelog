"use client";
import Link from "next/link";
import { useTokenCheck } from "@/lib/hooks/useTokenCheck";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { hasToken, loading } = useTokenCheck();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-surface-0/80 backdrop-blur-xl shadow-lg shadow-black/30">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 group shrink-0">
          <img src="/logo.png" alt="RepoNarrate" className="h-7 w-7" />
          <span className="text-base font-medium text-text-primary font-feature-settings-cv01-ss03 group-hover:text-brand-indigo transition-colors duration-200">RepoNarrate</span>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
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
                <span className="hidden sm:inline">Sign in</span>
                <svg className="sm:hidden h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M15 7a2 2 0 012 2m4 0a6 6 0 11-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="ml-1.5 sm:ml-0 sm:hidden">Sign in</span>
              </Button>
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
