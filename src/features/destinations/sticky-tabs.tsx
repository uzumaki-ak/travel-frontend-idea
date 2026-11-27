"use client";

/**
 * Keeps the destination's tabs in reach: once the hero's tab bar scrolls up out
 * of view, a copy (`floating`) slides in just under the site header, and leaves
 * again when the original comes back. Hidden copies are inert (not focusable).
 * The copy is portalled to <body>: the hero animates with transforms, which would
 * otherwise pin a fixed element to the hero instead of the window.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export function StickyTabs({ children, floating, desktopOnly = false }: { children: React.ReactNode; floating: React.ReactNode; /** Only from desktop width (pages with their own sticky bar on smaller screens). */ desktopOnly?: boolean }) {
  const anchor = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  // True only in the browser (the portal needs document.body).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    // Only when the bar has gone up past the header, not while it is still below the fold.
    const io = new IntersectionObserver(([entry]) => setShow(!!entry && !entry.isIntersecting && entry.boundingClientRect.bottom < 200), {
      rootMargin: "-96px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={anchor}>{children}</div>
      {mounted
        ? createPortal(
      <div
        aria-hidden={!show}
        inert={!show}
        className={`fixed inset-x-0 top-[calc(var(--header-h)+0.5rem+env(safe-area-inset-top,0px))] z-40 justify-center px-3 ${desktopOnly ? "hidden lg:flex" : "flex"} transition-[opacity,translate] duration-500 ease-out-expo md:top-[calc(var(--header-h)+2.5rem)] ${
          show ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        {floating}
      </div>,
            document.body,
          )
        : null}
    </>
  );
}
