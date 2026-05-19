const features = [
  {
    title: "AI Changelogs",
    description:
      "Every commit becomes a human-readable changelog entry, categorized by impact — breaking, feature, fix, and more.",
    delayClass: "animate-delay-100",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M16 13H8M16 17H8M10 9H8" />
      </svg>
    ),
  },
  {
    title: "Semantic Search",
    description:
      "Find commits by meaning, not keywords. Natural-language queries over pgvector embeddings of every change.",
    delayClass: "animate-delay-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    title: "Release Intelligence",
    description:
      "AI-written release summaries with breaking changes, features, and fixes grouped and ready to publish.",
    delayClass: "animate-delay-300",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M9 7h6" />
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

      <div className="container relative z-10 mx-auto px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-3 block text-xs font-medium uppercase tracking-[0.2em] text-brand-indigo">
            Capabilities
          </span>
          <h2
            className="text-balance text-3xl font-medium text-text-primary md:text-4xl font-feature-settings-cv01-ss03"
            style={{ letterSpacing: "-0.025em" }}
          >
            Three ways it makes history legible
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`card-linear h-full p-6 animate-fade-in-up ${feature.delayClass}`}
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-border-standard bg-surface-2 text-brand-indigo">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">
                {feature.title}
              </h3>
              <p className="text-sm leading-6 text-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
