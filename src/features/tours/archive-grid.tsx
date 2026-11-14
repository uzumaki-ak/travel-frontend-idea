"use client";

/**
 * "Load More" for the tour listing. Every card is already in the HTML (good for
 * search engines and no-JS visitors see the first batch plus a working list);
 * the button reveals the next batch instantly and moves focus to it.
 */
import { useRef, useState, type ReactNode } from "react";

export function ArchiveGrid({ cards, perPage, loadMoreLabel }: { cards: ReactNode[]; perPage: number; loadMoreLabel: string }) {
  const [visible, setVisible] = useState(perPage);
  const list = useRef<HTMLUListElement>(null);

  const loadMore = () => {
    const firstNew = visible;
    setVisible((v) => Math.min(v + perPage, cards.length));
    // After the new cards render, send keyboard/screen-reader users to the first one.
    requestAnimationFrame(() => {
      list.current?.children[firstNew]?.querySelector<HTMLAnchorElement>("h2 a")?.focus();
    });
  };

  return (
    <div className="flex flex-col items-center gap-14">
      <ul ref={list} className="grid w-full gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <li key={i} hidden={i >= visible} data-motion={i < perPage ? "rise" : undefined} className="min-w-0 motion-safe:animate-[fade-in_0.6s_var(--ease-out-expo)]">
            {card}
          </li>
        ))}
      </ul>

      {visible < cards.length ? (
        <button
          type="button"
          onClick={loadMore}
          className="rounded-full bg-ink px-8 py-3.5 font-display text-[1.05rem] font-semibold text-fog transition-colors hover:bg-river"
        >
          {loadMoreLabel}
        </button>
      ) : null}
    </div>
  );
}
