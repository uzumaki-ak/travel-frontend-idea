"use client";

/**
 * The page's single animation island.
 *
 * - Loads GSAP after hydration (split into its own chunk, so it never blocks
 *   first paint or the CSS hero intro).
 * - Scrolling is the browser's own (no smooth-scroll library), by request.
 * - Runs every declarative effect inside gsap.matchMedia, so all motion is
 *   skipped — and fully reverted — when the visitor prefers reduced motion.
 * - Content is visible without this component; it only adds motion.
 */
import { useEffect } from "react";
import { effects } from "./effects";
import { loadMotionKit } from "./motion-kit";

const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export function MotionDirector() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const kit = await loadMotionKit();
      if (disposed) return;
      const { gsap, ScrollTrigger } = kit;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const undo = effects.map((effect) => effect(kit, document));

        return () => {
          for (const fn of undo) fn?.();
        };
      });

      // Tabs, fonts and lazy images change page height; keep trigger positions honest.
      let frame = 0;
      let lastHeight = document.body.scrollHeight;
      const observer = new ResizeObserver(() => {
        const height = document.body.scrollHeight;
        if (height === lastHeight) return;
        lastHeight = height;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => ScrollTrigger.refresh());
      });
      observer.observe(document.body);

      cleanup = () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
        mm.revert();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return null;
}
