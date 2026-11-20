"use client";

/**
 * Desktop only: keeps its children (the price ticket) pinned in a right-hand
 * column while the visitor scrolls the whole page. It sits in an overlay that is
 * as tall as the content, on the same 12-column grid as the page.
 *
 * It stays hidden while the hero's own ticket (`afterId`) is still on screen, so
 * only one ticket is ever visible. While the package section (`yieldTo`) is on
 * screen its own "Your selection" card takes that spot, so the ticket fades out
 * there too and comes back afterwards.
 */
import { useEffect, useState } from "react";

export function StickyTicket({ children, yieldTo, afterId }: { children: React.ReactNode; yieldTo: string; afterId: string }) {
  const [inPackages, setInPackages] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    const target = document.getElementById(yieldTo);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setInPackages(Boolean(entry?.isIntersecting)), {
      rootMargin: "-150px 0px -40% 0px",
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [yieldTo]);

  useEffect(() => {
    const hero = document.getElementById(afterId);
    if (!hero) return setHeroVisible(false);
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(Boolean(entry?.isIntersecting)));
    observer.observe(hero);
    return () => observer.disconnect();
  }, [afterId]);

  const hidden = inPackages || heroVisible;

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
