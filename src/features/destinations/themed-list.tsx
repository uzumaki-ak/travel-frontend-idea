"use client";

/**
 * A section's cards with its own theme chips above them ("All", "Waterfalls", …).
 * Tours, experiences, attractions and cabs each pass their own themes. One chip at
 * a time; the cards are rendered on the server and only shown or hidden here.
 * Either a swipe rail (`rail`) or a plain list styled by the caller.
 */
import { useState } from "react";
import { Rail } from "@/ui/rail";

export type ThemedItem = { key: string; themes: string[]; node: React.ReactNode };
type Theme = { id: string; label: string };

type Props = {
  label: string;
  themes: Theme[];
  items: ThemedItem[];
  /** Swipe rail with arrows; otherwise a list with the classes below. */
  rail?: boolean;
  itemClassName?: string;
  listClassName?: string;
  /** Wrapper around the list (e.g. the page gutter from a breakpoint up). */
  outerClassName?: string;
};

export function ThemedList({ label, themes, items, rail = false, itemClassName = "", listClassName = "", outerClassName = "" }: Props) {
  const [theme, setTheme] = useState<string | null>(null);
  // Only themes that have something behind them.
  const options = themes.filter((t) => items.some((i) => i.themes.includes(t.id)));
  const shown = theme ? items.filter((i) => i.themes.includes(theme)) : items;

  const cells = shown.map((i) => (
    <div key={i.key} className={itemClassName}>
      {i.node}
    </div>
  ));

  return (
    <div className="flex flex-col gap-7">
      {options.length > 1 ? (
        <div className="wrap">
          <div role="group" aria-label={`${label}: themes`} className="scrollbar-none -mx-(--gutter-x) flex gap-2 overflow-x-auto px-(--gutter-x) md:mx-0 md:flex-wrap md:px-0">
            <Chip on={!theme} onClick={() => setTheme(null)} label="All" count={items.length} />
            {options.map((t) => (
              <Chip key={t.id} on={theme === t.id} onClick={() => setTheme(theme === t.id ? null : t.id)} label={t.label} count={items.filter((i) => i.themes.includes(t.id)).length} />
            ))}
          </div>
        </div>
      ) : null}
      {rail ? (
        // Keyed by theme so the rail starts from its first card after a change.
        <Rail key={theme ?? "all"} label={label}>
          {cells}
        </Rail>
      ) : (
        <div className={outerClassName}>
          <div className={listClassName}>{cells}</div>
        </div>
      )}
    </div>
  );
}

function Chip({ on, onClick, label, count }: { on: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-ink/15 py-1.5 pr-1.5 pl-4 font-display text-[0.9rem] font-medium transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-fog"
    >
      {label}
      <span className={`grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 font-mono text-[0.7rem] tabular-nums ${on ? "bg-mandarin text-ink" : "bg-ink/8 text-moss"}`}>{count}</span>
    </button>
  );
}
