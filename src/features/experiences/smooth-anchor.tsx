"use client";

/**
 * An in-page link that scrolls to its target at a calm, steady pace instead of
 * jumping. Used for "Choose package". The rest of the site scrolls natively.
 * Falls back to the plain anchor jump for reduced motion or if the target is missing.
 */
import type { ComponentProps } from "react";

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function SmoothAnchor({ href, onClick, ...rest }: ComponentProps<"a"> & { href: `#${string}` }) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        const target = document.getElementById(href.slice(1));
        if (e.defaultPrevented || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        e.preventDefault();

        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const from = window.scrollY;
        const to = Math.max(0, target.getBoundingClientRect().top + from - margin);
        const distance = to - from;
        if (Math.abs(distance) < 4) return;
        // About 1.2s for a long way, never under 0.7s or over 1.4s.
        const duration = Math.min(1400, Math.max(700, Math.abs(distance) * 0.45));
        const start = performance.now();
        let cancelled = false;
        const stop = () => {
          cancelled = true;
          window.removeEventListener("wheel", stop);
          window.removeEventListener("touchstart", stop);
          window.removeEventListener("keydown", stop);
        };
        // Any user input takes over again.
        window.addEventListener("wheel", stop, { passive: true });
        window.addEventListener("touchstart", stop, { passive: true });
        window.addEventListener("keydown", stop);

        const step = (now: number) => {
          if (cancelled) return;
          const t = Math.min(1, (now - start) / duration);
          window.scrollTo(0, from + distance * ease(t));
          if (t < 1) requestAnimationFrame(step);
          else {
            stop();
            history.replaceState(null, "", href);
          }
        };
        requestAnimationFrame(step);
      }}
    />
  );
}
