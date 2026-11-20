"use client";

/**
 * Desktop only: keeps its children (the price ticket) pinned in a right-hand
 * column while the visitor scrolls the whole page. It sits in an overlay that is
 * as tall as the content, on the same 12-column grid as the page.
 *
 * It stays hidden while the hero's own ticket (`afterId`) is still on screen, so
 * only one ticket is ever visible.
 */
import { useEffect, useState } from "react";

export function StickyTicket({ children, afterId }: { children: React.ReactNode; afterId: string }) {
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    const hero = document.getElementById(afterId);
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(Boolean(entry?.isIntersecting)));
    observer.observe(hero);
    return () => observer.disconnect();
  }, [afterId]);

  const hidden = heroVisible;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      <div className="wrap grid h-full grid-cols-12 gap-10">
        <div className="col-span-5 col-start-8">
          <div
            inert={hidden}
            className={`pointer-events-auto sticky top-48 transition-opacity duration-300 ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
