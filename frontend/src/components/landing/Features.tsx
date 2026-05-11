"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    title: "AI Changelogs",
    description: "Every commit gets a human-readable changelog entry, auto-generated and categorized by impact.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
        <path d="M10 9H8" />
      </svg>
    ),
  },
  {
    title: "Semantic Search",
    description: "Find commits by meaning, not just keywords. Natural language queries powered by vector embeddings.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    title: "Release Intelligence",
    description: "AI-generated release summaries with breaking changes, features, and fixes grouped automatically.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
];

function RevealCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.98]"
      }`}
    >
      {children}
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-24 bg-surface-1 relative overflow-hidden">
      {/* Section atmospheric gradients */}
      <div className="section-atmosphere" aria-hidden="true" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="corner-shine-tl" />
        <div className="corner-shine-br" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-xs font-medium text-brand-indigo uppercase tracking-widest mb-3 block">How it works</span>
          <h2 className="text-3xl md:text-4xl font-medium text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.025em" }}>
            Three steps to clarity
          </h2>
          <p className="mt-4 text-text-secondary max-w-lg mx-auto text-lg">
            From raw commits to polished release notes in minutes.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <RevealCard key={feature.title} delay={i * 150}>
              <Card className="card-linear p-6 h-full">
                <CardHeader className="p-0 mb-5">
                  <div className="mb-4 w-12 h-12 rounded-lg bg-surface-2 border border-border-standard flex items-center justify-center text-brand-indigo mx-auto">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg font-medium text-text-primary text-center font-feature-settings-cv01-ss03">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <CardDescription className="text-base text-text-secondary leading-relaxed text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </RevealCard>
          ))}
        </div>
      </div>
    </section>
  );
}
