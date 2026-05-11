"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getMe } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ERROR_MESSAGES: Record<string, string> = {
  github_auth_failed: "GitHub authentication failed. This may happen if the OAuth app settings are misconfigured. Please try signing in again.",
  oauth_failed: "Authentication failed. Please try signing in again.",
  access_denied: "Access was denied. You need to authorize the app to continue.",
};

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;

    if (hash.startsWith("#error=")) {
      const errorKey = decodeURIComponent(hash.slice(7));
      setError(ERROR_MESSAGES[errorKey] || `Authentication error: ${errorKey}`);
      return;
    }

    // Cookie was set server-side by /auth/github/callback.
    // Just verify we can reach /auth/me, then redirect.
    getMe()
      .then(() => {
        window.history.replaceState(null, "", "/auth/callback");
        router.replace("/dashboard");
      })
      .catch(() => {
        setError("No authentication response received. Please try signing in again.");
      });
  }, [router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 max-w-md text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Sign-in Failed</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" onClick={() => { window.location.href = `${API_URL}/auth/github`; }}>
          Try Again
        </Button>
        <Button variant="ghost" onClick={() => { window.location.href = "/"; }}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  );
}
