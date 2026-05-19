import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ChangelogShowcase } from "@/components/landing/ChangelogShowcase";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { FAQ } from "@/components/landing/FAQ";
import { CtaBand } from "@/components/landing/CtaBand";

const githubUrl = "https://github.com/LT-Ripjaws/github-ai-changelog";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div className="grain-overlay" aria-hidden="true" />
      <Navbar />
      <Hero />
      <ChangelogShowcase />
      <HowItWorks />
      <Features />
      <FAQ />
      <CtaBand />

      <footer className="border-t border-border-subtle bg-surface-0 py-14">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-sm font-medium text-text-primary font-feature-settings-cv01-ss03">
                RepoNarrate
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                &copy; {new Date().getFullYear()} · AI-powered GitHub changelog intelligence
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
              <a href="/privacy" className="text-text-tertiary transition-colors hover:text-text-primary">
                Privacy
              </a>
              <a href="/terms" className="text-text-tertiary transition-colors hover:text-text-primary">
                Terms
              </a>
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-text-tertiary transition-colors hover:text-text-primary"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
