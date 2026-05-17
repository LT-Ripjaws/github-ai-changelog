import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — RepoNarrate",
  description: "Terms for using RepoNarrate.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-text-tertiary transition-colors hover:text-text-primary">
        &larr; Back to home
      </Link>
      <h1 className="mt-6 text-2xl font-medium text-text-primary font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>
        Terms of Service
      </h1>
      <p className="mt-2 text-xs text-text-tertiary">Last updated: 2026-05-16</p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-text-secondary">
        <section className="space-y-2">
          <h2 className="text-base font-medium text-text-primary">Acceptable use</h2>
          <p>
            RepoNarrate is provided as-is for generating AI changelogs and release notes
            from GitHub repositories you have access to. Do not use it to process
            repositories you are not authorized to read.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-text-primary">No warranty</h2>
          <p>
            AI-generated summaries may be inaccurate or incomplete. The service is provided
            without warranty of any kind; verify critical information against the source
            commits and releases.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-text-primary">Availability</h2>
          <p>
            This is a personal/educational project. Availability, data retention, and
            features may change without notice.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-text-primary">Contact</h2>
          <p>
            Issues and questions can be raised via the project repository&apos;s issue
            tracker.
          </p>
        </section>
      </div>
    </main>
  );
}
