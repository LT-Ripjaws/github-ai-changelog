import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";

export default function Home() {
  return (
    <main className="min-h-screen bg-surface-0">
      <Navbar />
      <Hero />
      <Features />
      <footer className="py-8 text-center text-sm text-text-tertiary border-t border-border-subtle">
        <p>&copy; {new Date().getFullYear()} RepoNarrate. All rights reserved.</p>
      </footer>
    </main>
  );
}
