import { useEffect, useRef, type RefObject } from "react";

interface UseFocusTrapOptions {
  onEscape?: () => void;
  initialFocusRef?: RefObject<HTMLElement>;
}

/**
 * Accessible modal focus trap: Tab/Shift+Tab cycling within the container,
 * Escape handling, initial focus, and body scroll-lock (restoring the prior
 * value so nested scroll-locks survive). Shared by ConnectRepoModal and
 * ConfirmDialog instead of two near-identical inline copies.
 *
 * `onEscape` is read through a ref so changing its identity (or closing over
 * changing state like `loading`) never re-subscribes the listener or churns
 * the scroll-lock — the trap is set up once per open.
 */
export function useFocusTrap(
  active: boolean,
  { onEscape, initialFocusRef }: UseFocusTrapOptions = {},
): RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;

    initialFocusRef?.current?.focus();
    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscapeRef.current?.();
        return;
      }
      if (event.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, initialFocusRef]);

  return containerRef;
}
