"use client";

/**
 * Clamps long text to about `lines` lines with a fade and a "Read more" toggle.
 * Short text that already fits shows no button. The full text is always in the
 * HTML (only visually clamped), so search engines and screen readers get it all.
 */
import { useEffect, useId, useRef, useState } from "react";

export function ReadMore({ children, lines = 6, className = "" }: { children: React.ReactNode; lines?: number; className?: string }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
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
    return () => observer.disconnect();
  }, [lines]);

  const clamped = overflows && !open;

  return (
    <div className="flex flex-col items-start gap-3">
      <div
        ref={ref}
        id={id}
        className={`relative overflow-hidden ${className}`}
        style={clamped ? { maxHeight: limit, maskImage: "linear-gradient(to bottom, #000 55%, transparent)" } : undefined}
      >
        {children}
      </div>
      {overflows ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="cursor-pointer font-display text-[0.95rem] font-semibold underline decoration-mandarin decoration-2 underline-offset-[6px] transition-colors hover:text-mandarin"
        >
          {open ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}
