"use client";

/**
 * Split-flap text: on hover of the enclosing link, letters cycle through
 * random characters and settle left-to-right, like a station departure board.
 * Screen readers get the real text; the animated copy is aria-hidden.
 */
import { useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SETTLE_MS_PER_CHAR = 22;
const FRAME_MS = 32;

export function FlapText({ text, className }: { text: string; className?: string }) {
  const visual = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = visual.current;
    const trigger = el?.closest("a");
    if (!el || !trigger) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer = 0;
    const run = () => {
      window.clearInterval(timer);
      const start = performance.now();
      timer = window.setInterval(() => {
        const settled = Math.floor((performance.now() - start) / SETTLE_MS_PER_CHAR);
        el.textContent = Array.from(text, (ch, i) =>
          i < settled || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        ).join("");
        if (settled >= text.length) {
          window.clearInterval(timer);
          el.textContent = text;
        }
      }, FRAME_MS);
    };

    trigger.addEventListener("pointerenter", run);
    trigger.addEventListener("focus", run);
    return () => {
      window.clearInterval(timer);
      trigger.removeEventListener("pointerenter", run);
      trigger.removeEventListener("focus", run);
    };
  }, [text]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={visual} aria-hidden="true" className="tabular-nums">
        {text}
      </span>
    </span>
  );
}
