import { CATEGORY_COLORS } from "@/lib/constants";

const rawCommits = [
  { sha: "9f3a1c2", msg: "fix: clamp retry backoff so webhook storms don't thrash the queue" },
  { sha: "be17d40", msg: "refactor(auth): extract token rotation into AuthSession" },
  { sha: "2c8e5b9", msg: "feat: paginate the audit log endpoint (cursor-based)" },
  { sha: "a04f7e1", msg: "chore: bump pg 8.11 -> 8.13, drop unused lodash" },
  { sha: "77d9aa3", msg: "fix: tz drift in scheduled payout calc" },
];

const generated = [
  { cat: "feature", text: "Cursor-based pagination on the audit log endpoint for stable, fast history queries." },
  { cat: "fix", text: "Scheduled payouts now compute in the account's timezone, eliminating off-by-one-day drift." },
  { cat: "fix", text: "Webhook retry backoff is clamped so delivery storms no longer thrash the job queue." },
  { cat: "refactor", text: "Token rotation moved into a dedicated AuthSession (no behavior change)." },
];

export function ChangelogShowcase() {
  return (
    <section className="relative overflow-hidden bg-surface-1 py-24">
      <div className="section-atmosphere" aria-hidden="true" />
      <div className="container relative z-10 mx-auto px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="mb-3 block text-xs font-medium uppercase tracking-[0.2em] text-brand-indigo">
            Raw commits in, narrative out
          </span>
          <h2
            className="text-balance text-3xl font-medium text-text-primary md:text-4xl font-feature-settings-cv01-ss03"
            style={{ letterSpacing: "-0.025em" }}
          >
            It reads the diffs so your users don&apos;t have to
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl items-center gap-5 lg:grid-cols-[1fr_auto_1fr]">
          {/* before */}
          <div className="card-linear animate-fade-in-up p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
              git log
            </p>
            <div className="space-y-2 font-mono text-xs leading-relaxed text-text-tertiary">
              {rawCommits.map((c) => (
                <div key={c.sha} className="flex gap-2">
                  <span className="select-none text-text-quaternary">{c.sha}</span>
                  <span className="truncate">{c.msg}</span>
                </div>
              ))}
            </div>
          </div>

          {/* arrow */}
          <div
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-border-standard bg-surface-2 text-brand-indigo"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </div>

          {/* after */}
          <div className="card-linear animate-fade-in-up animate-delay-200 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-indigo/20 text-[9px] text-brand-indigo">
                AI
              </span>
              <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">
                Generated release notes
              </p>
            </div>
            <div className="space-y-3">
              {generated.map((g, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${CATEGORY_COLORS[g.cat] ?? ""}`}
                  >
                    {g.cat}
                  </span>
                  <p className="text-sm leading-6 text-text-secondary">{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
