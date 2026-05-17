import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";

const githubUrl = "https://github.com/LT-Ripjaws/github-ai-changelog";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />

      <footer className="border-t border-border-subtle bg-surface-0 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center">
            <p className="max-w-2xl text-center text-sm text-text-tertiary">
              &copy; {new Date().getFullYear()} RepoNarrate. AI-powered GitHub changelog intelligence.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6">
              <a href="/privacy" className="text-text-tertiary transition-colors hover:text-text-primary">
                Privacy
              </a>
              <span className="text-text-quaternary" aria-hidden="true">•</span>
              <a href="/terms" className="text-text-tertiary transition-colors hover:text-text-primary">
                Terms
              </a>
              <span className="text-text-quaternary" aria-hidden="true">•</span>
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
