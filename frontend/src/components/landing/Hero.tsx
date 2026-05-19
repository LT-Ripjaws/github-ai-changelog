import Link from "next/link";
import { ArrowUpRight, GitCommitHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingAuthActions } from "@/components/landing/LandingAuthActions";

const githubUrl = "https://github.com/LT-Ripjaws/github-ai-changelog";

/** GitHub wordmark glyph — lucide dropped brand icons, so inline SVG. */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 5.83 0c2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.67.42.36.79 1.08.79 2.18v3.23c0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12 24 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-surface-0">
      {/* 1 — the real hero photograph */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-bg.png)" }}
        aria-hidden="true"
      />

      {/* 2 — brand color-grade: pushes the photo toward the indigo/violet
              palette so it reads as part of the product, not a stock image */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] mix-blend-color"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(120deg, hsl(var(--brand-indigo) / 0.55) 0%, hsl(var(--brand-violet) / 0.32) 45%, transparent 80%)",
        }}
      />
      {/* 2b — subtle luminosity deepening so highlights don't blow out */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] mix-blend-multiply"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(120% 90% at 75% 25%, transparent 0%, hsl(var(--surface-0) / 0.45) 70%, hsl(var(--surface-0) / 0.85) 100%)",
        }}
      />

      {/* 3 — asymmetric readability scrim: opaque under the copy (left),
              clears toward the upper-right so the image still breathes */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(105deg, hsl(var(--surface-0) / 0.94) 0%, hsl(var(--surface-0) / 0.80) 32%, hsl(var(--surface-0) / 0.45) 58%, hsl(var(--surface-0) / 0.15) 100%)",
        }}
      />

      {/* 4 — cinematic vignette + clean fade into the next section */}
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(140% 120% at 50% 0%, transparent 55%, hsl(var(--surface-0) / 0.5) 100%), linear-gradient(to bottom, transparent 70%, hsl(var(--surface-1)) 100%)",
        }}
      />

      {/* atmospheric brand light (landing-scoped) */}
      <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden" aria-hidden="true">
        <div className="corner-shine-tl" />
        <div className="corner-shine-tr" />
        <div className="corner-shine-br" />
        <div className="hero-spotlight" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      {/* Content */}
      <div className="container relative z-20 mx-auto grid items-center gap-12 px-6 py-32 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
        <div className="max-w-xl">
          <div className="animate-fade-in-up mb-7 inline-flex items-center gap-2 rounded-full border border-border-standard bg-surface-2/50 px-3 py-1.5 backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-emerald opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success-emerald" />
            </span>
            <span className="text-xs font-medium tracking-wide text-text-secondary">
              AI changelog &amp; release intelligence
            </span>
          </div>

          <h1
            className="animate-fade-in-up animate-delay-100 text-balance text-5xl font-medium leading-[1.05] text-text-primary sm:text-6xl lg:text-7xl"
            style={{ letterSpacing: "-0.035em", textShadow: "0 2px 24px hsl(var(--surface-0) / 0.6)" }}
          >
            Changelogs your users
            <br className="hidden sm:block" />{" "}
            <span className="bg-gradient-to-r from-brand-hover via-brand-violet to-brand-indigo bg-clip-text text-transparent">
              actually read.
            </span>
          </h1>

          <p
            className="animate-fade-in-up animate-delay-200 mt-6 max-w-lg text-pretty text-lg leading-relaxed text-text-secondary"
            style={{ textShadow: "0 1px 8px hsl(var(--surface-0) / 0.5)" }}
          >
            Connect a GitHub repo and RepoNarrate turns raw commits into
            human-readable changelogs, categorized releases, and semantic search —
            generated by AI, styled like you wrote them by hand.
          </p>

          <div className="animate-fade-in-up animate-delay-300 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <LandingAuthActions variant="hero" />
            <Button asChild variant="outline" size="lg" className="btn-linear-ghost px-6 py-3 text-base font-medium">
              <Link href="#features">See how it works</Link>
            </Button>
          </div>

          <div className="animate-fade-in-up animate-delay-500 mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-tertiary">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success-emerald" />
              Open source · MIT
            </span>
            <span className="h-3 w-px bg-border-standard" aria-hidden="true" />
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-text-primary"
            >
              <GithubMark className="h-3.5 w-3.5" />
              Star on GitHub
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
            <span className="h-3 w-px bg-border-standard" aria-hidden="true" />
            <span>Self-hosted &amp; private</span>
          </div>
        </div>

        {/* Floating product proof — a real, on-theme generated changelog entry
            built from the same primitives the app uses (no stock mockup) */}
        <div className="animate-fade-in-up animate-delay-300 hidden lg:block" aria-hidden="true">
          <div className="card-linear ml-auto w-full max-w-md p-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <GitCommitHorizontal className="h-4 w-4 text-brand-indigo" />
                acme/payments-api
              </div>
              <span className="rounded-full border border-border-standard px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-tertiary">
                v2.4.0
              </span>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-full border border-cat-feature/30 bg-cat-feature/15 px-2 py-0.5 text-[10px] font-medium capitalize text-cat-feature">
                  feature
                </span>
                <p className="text-sm leading-6 text-text-secondary">
                  Add idempotency keys to the charge endpoint so retried requests
                  no longer double-bill customers.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-full border border-cat-fix/30 bg-cat-fix/15 px-2 py-0.5 text-[10px] font-medium capitalize text-cat-fix">
                  fix
                </span>
                <p className="text-sm leading-6 text-text-secondary">
                  Correct timezone drift in scheduled payout calculations.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded-full border border-cat-breaking/30 bg-cat-breaking/15 px-2 py-0.5 text-[10px] font-medium capitalize text-cat-breaking">
                  breaking
                </span>
                <p className="text-sm leading-6 text-text-secondary">
                  Remove the deprecated <code className="rounded bg-surface-2 px-1 font-mono text-xs">/v1/refunds</code> route.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-border-subtle pt-3 text-xs text-text-tertiary">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-indigo/20 text-[9px] text-brand-indigo">
                AI
              </span>
              Summarized from 18 commits in 2.3s
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
