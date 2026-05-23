"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_URL } from "@/lib/config";
import type { User } from "@/lib/types";

interface AppNavbarProps {
  initialUser: User;
}

export function AppNavbar({ initialUser }: AppNavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Redirect anyway; the server cookie may already be gone or unreachable.
    } finally {
      setUser(null);
      router.replace("/");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-0/95 shadow-md shadow-black/30 backdrop-blur supports-[backdrop-filter]:bg-surface-0/80">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/dashboard" prefetch className="flex min-w-0 items-center gap-2">
            <Image src="/logo.png" alt="RepoNarrate" width={32} height={32} priority className="h-8 w-8 object-contain" />
            <span className="truncate font-feature-settings-cv01-ss03 text-lg font-medium text-text-primary">
              RepoNarrate
            </span>
          </Link>

          <nav aria-label="Global navigation" className="hidden items-center gap-1 sm:flex">
            <Link
              href="/dashboard"
              prefetch
              className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              Repositories
            </Link>
          </nav>
        </div>

        {user ? (
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.username} /> : null}
                <AvatarFallback className="bg-surface-2 text-text-primary">
                  {user.username?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-text-secondary sm:block">
                {user.username}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              disabled={loggingOut}
              className="btn-linear-ghost"
            >
              {loggingOut ? "Logging out…" : "Logout"}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
