import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — RepoNarrate",
  description: "How RepoNarrate handles your data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-text-tertiary transition-colors hover:text-text-primary">
        &larr; Back to home
      </Link>
      <h1 className="mt-6 text-2xl font-medium text-text-primary font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.288px" }}>
        Privacy Policy
      </h1>
      <p className="mt-2 text-xs text-text-tertiary">Last updated: 2026-05-16</p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-text-secondary">
        <section className="space-y-2">
          <h2 className="text-base font-medium text-text-primary">What we store</h2>
          <p>
            RepoNarrate stores your GitHub profile (id, username, display name, avatar,
            email) and an encrypted GitHub access token used solely to read the
            repositories you connect. It also stores the commits, releases, and
            AI-generated changelog data for those repositories.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-text-primary">How we use it</h2>
          <p>
            Your access token is used only to fetch repository data from GitHub on your
            behalf. Commit messages and diffs are sent to an AI provider to generate
            changelog and summary text. We do not sell or share your data.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-text-primary">Data removal</h2>
          <p>
            Removing a connected repository deletes its commits, embeddings, and releases.
            Revoking the RepoNarrate OAuth app from your GitHub settings invalidates the
            stored access token.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-base font-medium text-text-primary">Contact</h2>
          <p>
            Questions about this policy can be raised via the project repository&apos;s
            issue tracker.
          </p>
        </section>
      </div>
    </main>
  );
}
