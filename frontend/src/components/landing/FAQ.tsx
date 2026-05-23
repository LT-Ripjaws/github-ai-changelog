const faqs = [
  {
    q: "Does it need write access to my repos?",
    a: "No. The GitHub scope is only used to read commits and releases for the repositories you connect. Nothing is pushed back.",
  },
  {
    q: "Where does my data live?",
    a: "RepoNarrate is self-hostable and your GitHub token is encrypted at rest. Commit text is sent to an AI provider only to generate summaries — nothing is sold or shared.",
  },
  {
    q: "Which repositories work?",
    a: "Any public or private repository your GitHub account can access. Releases are reconstructed automatically from tags and commit ranges.",
  },
  {
    q: "How accurate are the AI changelogs?",
    a: "Summaries are generated from real diffs and grouped by impact, but AI can be imperfect — every entry links back to its source commit so you can verify.",
  },
  {
    q: "Is it open source?",
    a: "Yes — MIT licensed. You can read the code, self-host, and contribute on GitHub.",
  },
];

const faqDelays = ["80", "140", "200", "260", "320"];

export function FAQ() {
  return (
    <section
      className="landing-lazy-section relative bg-surface-0 py-24"
      data-lazy-size="medium"
      data-scroll-section
    >
      <div className="container relative z-10 mx-auto px-6">
        <div
          className="mx-auto mb-14 max-w-2xl text-center"
          data-scroll-reveal
          data-reveal-effect="up"
        >
          <span className="mb-3 block text-xs font-medium uppercase tracking-[0.2em] text-brand-indigo">
            Questions
          </span>
          <h2
            className="text-balance text-3xl font-medium text-text-primary md:text-4xl font-feature-settings-cv01-ss03"
            style={{ letterSpacing: "-0.025em" }}
          >
            Everything you might be wondering
          </h2>
        </div>

        <div
          className="mx-auto max-w-3xl divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-standard bg-surface-1"
          data-scroll-reveal
          data-reveal-effect="up"
          data-reveal-delay="80"
        >
          {faqs.map((f, i) => (
            <details
              key={f.q}
              className="group"
              data-scroll-reveal
              data-reveal-effect="soft"
              data-reveal-delay={faqDelays[i]}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left text-base font-medium text-text-primary transition-colors hover:bg-surface-2/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-indigo/60">
                {f.q}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 shrink-0 text-text-tertiary transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <p className="px-5 pb-5 text-sm leading-6 text-text-secondary">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
