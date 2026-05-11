import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";

export default function Home() {
  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />
      <main className="min-h-screen">
        <Navbar />
        <Hero />
        <Features />

        {/* Footer */}
        <footer className="py-16 bg-surface-0 border-t border-border-subtle">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center">
              <p className="text-sm text-text-tertiary max-w-2xl text-center">
                &copy; {new Date().getFullYear()} RepoNarrate. All rights reserved.
              </p>
              <div className="mt-4 flex items-center gap-6 text-sm">
                <a href="/privacy" className="text-text-tertiary hover:text-text-primary transition-colors">Privacy</a>
                <span className="text-text-quaternary">•</span>
                <a href="/terms" className="text-text-tertiary hover:text-text-primary transition-colors">Terms</a>
                <span className="text-text-quaternary">•</span>
                <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors">GitHub</a>
                <span className="text-text-quaternary">•</span>
                <a href="#" className="text-text-tertiary hover:text-text-primary transition-colors">Twitter</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
