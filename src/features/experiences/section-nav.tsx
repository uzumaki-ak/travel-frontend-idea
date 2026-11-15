"use client";

/**
 * In-page section bar, pinned under the header. Highlights the section in view
 * and scrolls the active link into view on narrow screens.
 */
import { useEffect, useRef, useState } from "react";

export type SectionLink = { id: string; label: string };

export function SectionNav({ links }: { links: SectionLink[] }) {
  const [active, setActive] = useState(links[0]?.id ?? "");
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : Infinity);
        // The topmost section that is on screen wins.
        let best = "";
        let bestTop = Infinity;
        for (const { id } of links) {
          const top = visible.get(id) ?? Infinity;
          if (top < bestTop) {
            best = id;
            bestTop = top;
          }
        }
        if (best) setActive(best);
      },
      { rootMargin: "-30% 0px -55% 0px" },
    );
    for (const { id } of links) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [links]);

  useEffect(() => {
    const link = listRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    link?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label="On this page" className="sticky top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] z-30 mt-10 border-y border-ink/10 bg-fog/90 backdrop-blur-md md:top-[calc(var(--header-h)+2rem)]">
      <ul ref={listRef} className="wrap scrollbar-none flex gap-1 overflow-x-auto">
        {links.map((l) => (
          <li key={l.id} className="shrink-0">
            <a
              href={`#${l.id}`}
              data-id={l.id}
              aria-current={active === l.id ? "location" : undefined}
              className="relative block px-3 py-3.5 font-display text-[0.92rem] font-medium text-moss transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-mandarin after:transition-transform after:duration-500 after:ease-out-expo hover:text-ink aria-[current]:text-ink aria-[current]:after:scale-x-100"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
