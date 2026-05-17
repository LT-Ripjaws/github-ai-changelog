import Image from "next/image";
import Link from "next/link";
import { LandingAuthActions } from "@/components/landing/LandingAuthActions";

export function Navbar() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border-subtle bg-surface-0/80 shadow-lg shadow-black/30 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center space-x-2">
          <Image src="/logo.png" alt="RepoNarrate" width={28} height={28} priority className="h-7 w-7 object-contain" />
          <span className="text-base font-medium text-text-primary transition-colors duration-200 group-hover:text-brand-indigo font-feature-settings-cv01-ss03">
            RepoNarrate
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <LandingAuthActions variant="nav" />
        </div>
      </div>
    </nav>
  );
}
