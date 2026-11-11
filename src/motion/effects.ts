/**
 * Declarative scroll effects. Markup opts in with `data-motion="<name>"`;
 * sections stay server components and never import GSAP themselves.
 *
 * Every effect only touches transform / opacity / clip-path.
 */
import { all, type MotionEffect } from "./motion-kit";

const EASE = "expo.out";

/** Headings: lines rise out of a mask when they scroll into view. */
export const lines: MotionEffect = ({ gsap, SplitText }, root) => {
  for (const el of all(root, '[data-motion="lines"]')) {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.1,
          stagger: 0.08,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }),
    });
  }
};

/** Blocks and cards: a short rise + fade, batched so siblings stagger together. */
export const rise: MotionEffect = ({ gsap, ScrollTrigger }, root) => {
  const targets = all(root, '[data-motion="rise"]');
  if (targets.length === 0) return;
  gsap.set(targets, { y: 28, autoAlpha: 0 });
  ScrollTrigger.batch(targets, {
    start: "top 92%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.07, ease: EASE, overwrite: true }),
  });
};

/** Long-form copy: words fill in as the reader scrolls through it. */
export const words: MotionEffect = ({ gsap, SplitText }, root) => {
  for (const el of all(root, '[data-motion="words"]')) {
    SplitText.create(el, {
      type: "words",
      autoSplit: true,
      onSplit: (self) =>
        gsap.fromTo(
          self.words,
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.05,
            scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: true },
          },
        ),
    });
  }
};

/** Depth: element drifts against the scroll. `data-speed` ≈ fraction of its own height. */
export const parallax: MotionEffect = ({ gsap }, root) => {
  for (const el of all(root, "[data-speed]")) {
    const speed = Number(el.dataset.speed ?? 0);
    gsap.fromTo(
      el,
      { yPercent: -speed * 50 },
      {
        yPercent: speed * 50,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
      },
    );
  }
};

/** Hero panorama: the framed band opens to full bleed while the photo settles. */
export const panorama: MotionEffect = ({ gsap }, root) => {
  for (const el of all(root, '[data-motion="panorama"]')) {
    const img = el.querySelector("img");
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 25%", scrub: 0.6 },
    });
    timeline.fromTo(
      el,
      { clipPath: "inset(0% var(--gutter-x) 0% var(--gutter-x) round 28px)" },
      { clipPath: "inset(0% 0px 0% 0px round 0px)", ease: "none" },
      0,
    );
    if (img) timeline.fromTo(img, { scale: 1.18 }, { scale: 1, ease: "none" }, 0);
  }
};

/**
 * Mouse depth: inside `[data-pointer-zone]`, each `[data-depth]` layer shifts
 * by its own depth (px) as the pointer moves across the section. Fine pointers only.
 */
export const pointerDepth: MotionEffect = ({ gsap }, root) => {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const cleanups: (() => void)[] = [];

  for (const zone of all(root, "[data-pointer-zone]")) {
    const area = zone.closest("section") ?? zone;
    const layers = all(zone, "[data-depth]").map((el) => ({
      depth: Number(el.dataset.depth ?? 0),
      x: gsap.quickTo(el, "x", { duration: 1.4, ease: "power3.out" }),
      y: gsap.quickTo(el, "y", { duration: 1.4, ease: "power3.out" }),
    }));

    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      for (const layer of layers) {
        layer.x(nx * layer.depth);
        layer.y(ny * layer.depth);
      }
    };
    const onLeave = () => {
      for (const layer of layers) {
        layer.x(0);
        layer.y(0);
      }
    };

    area.addEventListener("pointermove", onMove);
    area.addEventListener("pointerleave", onLeave);
    cleanups.push(() => {
      area.removeEventListener("pointermove", onMove);
      area.removeEventListener("pointerleave", onLeave);
    });
  }

  return () => cleanups.forEach((fn) => fn());
};

export const effects: MotionEffect[] = [lines, rise, words, parallax, panorama, pointerDepth];
