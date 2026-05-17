import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "AI Changelogs",
    description: "Every commit gets a human-readable changelog entry, auto-generated and categorized by impact.",
    delayClass: "animate-delay-100",
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
    delayClass: "animate-delay-200",
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
    delayClass: "animate-delay-300",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden bg-surface-1 py-24">
      <div className="section-atmosphere" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="corner-shine-tl" />
        <div className="corner-shine-br" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="mb-16 text-center">
          <span className="mb-3 block text-xs font-medium uppercase tracking-widest text-brand-indigo">How it works</span>
          <h2 className="text-3xl font-medium text-text-primary text-balance md:text-4xl font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.025em" }}>
            Three steps to clarity
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-text-secondary">
            From raw commits to polished release notes in minutes.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className={`card-linear h-full p-6 animate-fade-in-up ${feature.delayClass}`}>
              <CardHeader className="mb-5 p-0">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-border-standard bg-surface-2 text-brand-indigo">
                  {feature.icon}
                </div>
                <CardTitle className="text-center text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription className="text-center text-base leading-relaxed text-text-secondary">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
