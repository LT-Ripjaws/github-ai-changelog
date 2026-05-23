const steps = [
  {
    n: "01",
    title: "Connect a repository",
    body: "Sign in with GitHub and point RepoNarrate at any repo you can access — public or private. No webhooks, no CI config.",
  },
  {
    n: "02",
    title: "AI reads every commit",
    body: "Each commit and diff is summarized, categorized, and embedded — releases are reconstructed and grouped automatically.",
  },
  {
    n: "03",
    title: "Ship readable history",
    body: "Browse human-readable changelogs, semantic search by meaning, and release notes your users will actually read.",
  },
];

const stepDelays = ["80", "180", "280"];

export function HowItWorks() {
  return (
    <section
      className="landing-lazy-section relative overflow-hidden bg-surface-0 py-24"
      data-lazy-size="medium"
      data-scroll-section
    >
      <div className="container relative z-10 mx-auto px-6">
        <div
          className="mx-auto mb-16 max-w-2xl text-center"
          data-scroll-reveal
          data-reveal-effect="up"
        >
          <span className="mb-3 block text-xs font-medium uppercase tracking-[0.2em] text-brand-indigo">
            How it works
          </span>
          <h2
            className="text-balance text-3xl font-medium text-text-primary md:text-4xl font-feature-settings-cv01-ss03"
            style={{ letterSpacing: "-0.025em" }}
          >
            From raw git history to a story in minutes
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl gap-px overflow-hidden rounded-xl border border-border-standard bg-border-subtle md:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className="bg-surface-1 p-7"
              data-scroll-reveal
              data-reveal-effect="up"
              data-reveal-delay={stepDelays[i]}
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="font-mono text-sm text-brand-indigo tabular-nums">{step.n}</span>
                <span className="scroll-step-line h-px flex-1 bg-border-standard" aria-hidden="true" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-text-primary font-feature-settings-cv01-ss03">
                {step.title}
              </h3>
              <p className="text-sm leading-6 text-text-secondary">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
