"use client";

/**
 * The page's single animation island.
 *
 * - Loads GSAP + Lenis after hydration (split into their own chunk, so they
 *   never block first paint or the CSS hero intro).
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
      const [kit, { default: Lenis }] = await Promise.all([loadMotionKit(), import("lenis")]);
      if (disposed) return;
      const { gsap, ScrollTrigger } = kit;

      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const lenis = new Lenis({ autoRaf: false, anchors: { offset: -16 }, allowNestedScroll: true });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        const undo = effects.map((effect) => effect(kit, document));

        return () => {
          for (const fn of undo) fn?.();
          gsap.ticker.remove(tick);
          lenis.destroy();
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
