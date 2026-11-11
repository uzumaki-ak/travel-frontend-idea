import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import type { SplitText as SplitTextType } from "gsap/SplitText";

/** The animation libraries, loaded lazily and handed to every effect. */
export type MotionKit = {
  gsap: typeof Gsap;
  ScrollTrigger: typeof ScrollTriggerType;
  SplitText: typeof SplitTextType;
};

/**
 * An effect wires one `data-motion` behaviour. Tweens and triggers are reverted
 * by gsap.matchMedia; anything else (event listeners) is undone by the returned cleanup.
 */
export type MotionEffect = (kit: MotionKit, root: ParentNode) => void | (() => void);

export async function loadMotionKit(): Promise<MotionKit> {
  const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/SplitText"),
  ]);
  gsap.registerPlugin(ScrollTrigger, SplitText);
  return { gsap, ScrollTrigger, SplitText };
}

export function all<T extends Element = HTMLElement>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}
