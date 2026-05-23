import { LandingAuthActions } from "@/components/landing/LandingAuthActions";

export function CtaBand() {
  return (
    <section
      className="landing-cta-section landing-lazy-section relative overflow-hidden bg-surface-1 py-24"
      data-lazy-size="medium"
      data-scroll-section
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="corner-shine-tl" />
        <div className="corner-shine-br" />
        <div className="hero-spotlight cta-spotlight" />
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div
          className="mx-auto max-w-2xl text-center"
          data-scroll-reveal
          data-reveal-effect="scale"
        >
          <h2
            className="text-balance text-3xl font-medium text-text-primary md:text-5xl font-feature-settings-cv01-ss03"
            style={{ letterSpacing: "-0.03em" }}
          >
            Give your commits a voice
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-lg leading-relaxed text-text-secondary">
            Connect a repository and watch raw git history become a changelog
            you&apos;d actually publish — in under a minute.
          </p>
          <div
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            data-scroll-reveal
            data-reveal-effect="up"
            data-reveal-delay="160"
          >
            <LandingAuthActions variant="hero" />
            <span className="text-xs text-text-tertiary">No card. Open source. Self-hostable.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
