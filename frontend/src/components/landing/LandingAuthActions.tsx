"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTokenCheck } from "@/lib/hooks/useTokenCheck";
import { API_URL } from "@/lib/config";

interface LandingAuthActionsProps {
  variant: "nav" | "hero";
}

export function LandingAuthActions({ variant }: LandingAuthActionsProps) {
  // Render the logged-out CTA immediately (no blocking pulse / CLS). The auth
  // probe only *upgrades* the CTA to "Dashboard" once it confirms a session.
  const { hasToken } = useTokenCheck();
  const authHref = `${API_URL}/auth/github`;

  if (variant === "nav") {
    if (hasToken) {
      return (
        <Button asChild variant="outline" size="sm" className="btn-linear-ghost px-3 py-1.5 text-xs font-medium">
          <Link href="/dashboard" prefetch>
            Dashboard
          </Link>
        </Button>
      );
    }

    return (
      <Button asChild variant="outline" size="sm" className="btn-linear-ghost px-3 py-1.5 text-xs font-medium">
        <a href={authHref}>
          <span className="hidden sm:inline">Sign in</span>
          <svg className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" aria-hidden="true">
            <path d="M15 7a2 2 0 0 1 2 2m4 0a6 6 0 1 1-7.743 5.743L11 17H9v2H7v2H4a1 1 0 0 1-1-1v-2.586a1 1 0 0 1 .293-.707l5.964-5.964A6 6 0 1 1 21 9z" />
          </svg>
          <span className="ml-1.5 sm:hidden">Sign in</span>
        </a>
      </Button>
    );
  }

  if (hasToken) {
    return (
      <Button asChild size="lg" className="btn-linear-primary px-8 py-3 text-base font-medium shadow-lg shadow-brand-indigo/20">
        <Link href="/dashboard" prefetch>
          Go to Dashboard
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild size="lg" className="btn-linear-primary px-8 py-3 text-base font-medium shadow-lg shadow-brand-indigo/20 transition-shadow duration-200 hover:shadow-brand-indigo/30">
      <a href={authHref}>Get Started Free</a>
    </Button>
  );
}
