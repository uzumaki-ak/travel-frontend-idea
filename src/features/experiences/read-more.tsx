"use client";

/**
 * Clamps long text to about `lines` lines with a fade and a "Read more" toggle.
 * Short text that already fits shows no button. The full text is always in the
 * HTML (only visually clamped), so search engines and screen readers get it all.
 * Opening and closing both glide; on "Read less" the page also glides back to the
 * top of the text if it has scrolled out of view, so the reader keeps their place.
 */
import { useEffect, useId, useRef, useState } from "react";

export function ReadMore({ children, lines = 6, className = "" }: { children: React.ReactNode; lines?: number; className?: string }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  // Max height while animating: a pixel value both ways, "none" once fully open.
  const [height, setHeight] = useState<string | null>(null);
  const done = useRef<number | undefined>(undefined);
  const limit = `calc(${lines} * 1lh)`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 24;
      setOverflows(el.scrollHeight > lh * lines + 4);
    };
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(done.current);
    };
  }, [lines]);

  const clamped = overflows && !open;

  const toggle = () => {
    const el = ref.current;
    if (!el) return;
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 24;
    const closed = `${lh * lines}px`;
    const full = `${el.scrollHeight}px`;
    const opening = !open;
    // Pin the start height, wait two frames so the browser has painted it, then move to the end height.
    setOpen(opening);
    setHeight(opening ? closed : full);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setHeight(opening ? full : closed);
        if (!opening) {
          const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 80;
          const top = el.getBoundingClientRect().top;
          if (top < header) window.scrollTo({ top: window.scrollY + top - header - 24, behavior: "smooth" });
        }
      }),
    );
    // After the glide: open drops the cap so text reflows freely; closed goes back to the clamp with its fade.
    window.clearTimeout(done.current);
    done.current = window.setTimeout(() => setHeight(opening ? "none" : null), 560);
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <div
        ref={ref}
        id={id}
        className={`relative overflow-hidden transition-[max-height] duration-500 ease-out-expo ${className}`}
        style={
          height !== null
            ? { maxHeight: height }
            : clamped
              ? { maxHeight: limit, maskImage: "linear-gradient(to bottom, #000 55%, transparent)" }
              : undefined
        }
      >
        {children}
      </div>
      {overflows ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={toggle}
          className="cursor-pointer font-display text-[0.95rem] font-semibold underline decoration-mandarin decoration-2 underline-offset-[6px] transition-colors hover:text-mandarin"
        >
          {open ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
