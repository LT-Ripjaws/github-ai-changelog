"use client";

import { useEffect } from "react";

const revealSelector = "[data-scroll-reveal], [data-scroll-section]";

export function LandingScrollEffects() {
  useEffect(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>(revealSelector),
    );

    const showAll = () => {
      for (const element of revealElements) {
        element.classList.add("is-visible");
      }
    };

    root.classList.add("landing-scroll-effects-ready");

    let observer: IntersectionObserver | null = null;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      showAll();
    } else {
      observer = new IntersectionObserver(
        (entries, currentObserver) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              continue;
            }

            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
          }
        },
        {
          rootMargin: "0px 0px -12% 0px",
          threshold: 0.16,
        },
      );

      for (const element of revealElements) {
        observer.observe(element);
      }
    }

    let animationFrame = 0;

    const syncProgress = () => {
      animationFrame = 0;

      const scrollableHeight = root.scrollHeight - window.innerHeight;
      const progress =
        scrollableHeight > 0
          ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight))
          : 0;

      root.style.setProperty("--landing-scroll-progress", progress.toFixed(4));
    };

    const requestProgressSync = () => {
      if (animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(syncProgress);
      }
    };

    syncProgress();
    window.addEventListener("scroll", requestProgressSync, { passive: true });
    window.addEventListener("resize", requestProgressSync);

    return () => {
      observer?.disconnect();

      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("scroll", requestProgressSync);
      window.removeEventListener("resize", requestProgressSync);
      root.classList.remove("landing-scroll-effects-ready");
      root.style.removeProperty("--landing-scroll-progress");
    };
  }, []);

  return (
    <div className="landing-scroll-rail" aria-hidden="true">
      <span />
    </div>
  );
}
