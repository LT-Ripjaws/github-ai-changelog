"use client";
import Link from "next/link";
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export function AppNavbar() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <header className="border-b border-border-subtle bg-surface-0">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-9 w-20 bg-muted rounded animate-pulse" />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-border-subtle bg-surface-0">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-brand-indigo flex items-center justify-center">
              <span className="text-white font-medium text-sm">CA</span>
            </div>
            <span className="font-medium text-lg text-text-primary font-feature-settings-cv01-ss03">RepoNarrate</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user && (
            <>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl} alt={user.username} />
                  <AvatarFallback className="bg-surface-2 text-text-primary">{user.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block text-text-secondary">{user.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="btn-linear-ghost">
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
