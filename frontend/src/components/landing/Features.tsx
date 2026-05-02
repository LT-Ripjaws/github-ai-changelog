import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "AI Changelogs",
    description: "Every commit gets a human-readable changelog entry, auto-generated and categorized.",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
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

export function Features() {
  return (
    <section className="py-20 bg-surface-1">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-medium text-center mb-16 text-text-primary text-balance font-feature-settings-cv01-ss03" style={{ letterSpacing: "-0.704px" }}>How it works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              className={`card-linear p-6 animate-fade-in-up animate-delay-${(i + 1) * 100} hover:border-brand-indigo/30 transition-all`}
            >
              <CardHeader className="p-0 mb-4">
                <div className="mb-3 text-brand-indigo">{feature.icon}</div>
                <CardTitle className="text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <CardDescription className="text-base text-text-secondary leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
