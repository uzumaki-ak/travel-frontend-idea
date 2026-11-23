"use client";

/**
 * The hub's tour list, under a sticky bar with a "Filters" button and theme chips.
 * (Cabs and attractions belong on the destination's parent page, not here.)
 *
 *  - "Filters" opens the full panel (bottom sheet on phones, right panel on
 *    tablet up): Themes and Duration. Quick chips toggle the same themes.
 *  - Within a group, picks widen the results (OR); across groups they narrow (AND).
 *    Tours matching more picked themes come first, then the hub's own `rank`.
 *  - Everything updates in place (no URL change). 8 at a time, then "Show more".
 *  - Changes morph the cards into place with the View Transitions API where
 *    available; elsewhere, or with reduced motion, they just update.
 */
import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Destination, DestinationListing } from "@/content/destinations/schema";
import { ArrowRightIcon, CheckIcon, CrossIcon } from "@/ui/icons";
import { EMPTY, FilterSheet, type Duration, type Filters } from "./filter-sheet";
import { TourCard } from "./tour-card";

const PAGE = 8;
/** The content card sits after this many results ("content in between"). */
const INTERLUDE_AFTER = 5;

const DURATION_LABEL: Record<Duration, string> = { day: "A day or less", short: "2–3 days", long: "4 days or more" };

type Props = Pick<Destination, "name" | "categories" | "listings" | "interlude">;

const durationOf = (l: DestinationListing): Duration => (l.days <= 1 ? "day" : l.days <= 3 ? "short" : "long");
const filterCount = (f: Filters) => f.themes.length + f.durations.length;

/** Does a tour pass the filters? Returns its theme-hit count (for ordering), or -1 to drop it. */
function score(l: DestinationListing, f: Filters): number {
  const hits = l.categories.filter((c) => f.themes.includes(c)).length;
  if (f.themes.length && hits === 0) return -1;
  if (f.durations.length && !f.durations.includes(durationOf(l))) return -1;
  return hits;
}

/** Listings arrive in rank order; more theme hits first, rank breaks ties. */
function select(listings: DestinationListing[], f: Filters): DestinationListing[] {
  return listings
    .map((l, i) => ({ l, i, s: score(l, f) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.l);
}

function withTransition(update: () => void) {
  // Phones skip the reflow animation: its snapshots draw above the fixed header and
  // enquiry bar, and the jump back to the list top makes them glitch.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px)").matches;
  if (reduced || typeof document.startViewTransition !== "function") return update();
  document.startViewTransition(() => flushSync(update));
}

export function HubBrowser({ name, categories, listings, interlude }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [limit, setLimit] = useState(PAGE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const results = useMemo(() => select(listings, filters), [listings, filters]);
  const countFor = (f: Filters) => select(listings, f).length;

  // Option lists with totals (how many tours carry each option).
  const themeOptions = categories.map((c) => ({ id: c.id, label: c.label, count: listings.filter((l) => l.categories.includes(c.id)).length }));
  const durationOptions = (Object.keys(DURATION_LABEL) as Duration[]).map((id) => ({ id, label: DURATION_LABEL[id], count: listings.filter((l) => durationOf(l) === id).length })).filter((o) => o.count > 0);

  const backToTop = () =>
    requestAnimationFrame(() => {
      const el = top.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
    });
  const apply = (next: Filters) => {
    withTransition(() => {
      setFilters(next);
      setLimit(PAGE);
    });
    backToTop();
  };
  const toggleTheme = (id: string) => apply({ ...filters, themes: filters.themes.includes(id) ? filters.themes.filter((x) => x !== id) : [...filters.themes, id] });

  // Theme chips: picked ones first (in the order picked), then the rest.
  const quick = themeOptions.map((o) => ({ id: o.id, label: o.label, on: filters.themes.includes(o.id) }));
  const chips = [...quick.filter((c) => c.on).sort((a, b) => filters.themes.indexOf(a.id) - filters.themes.indexOf(b.id)), ...quick.filter((c) => !c.on)];

  const active = filterCount(filters);
  const shown = results.slice(0, limit);
  const remaining = results.length - shown.length;

  return (
    <div ref={top} className="scroll-mt-40 md:scroll-mt-52">
      {/* Sticky filter bar: "Filters" + quick chips. */}
      <div className="sticky top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] z-30 border-y border-ink/10 bg-cloud/90 backdrop-blur-md md:top-[calc(var(--header-h)+2rem)]">
        <div className="wrap flex items-center gap-3 py-3">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border border-ink bg-ink py-2 pr-4 pl-3.5 font-display text-[0.92rem] font-semibold text-fog transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round">
              <path d="M2 4h7M12 4h2M2 12h2M7 12h7" />
              <circle cx="10.5" cy="4" r="1.6" />
              <circle cx="5.5" cy="12" r="1.6" />
            </svg>
            Filters
            {active ? <span className="grid size-5 place-items-center rounded-full bg-mandarin font-mono text-[0.7rem] text-ink tabular-nums">{active}</span> : null}
          </button>
          <span aria-hidden="true" className="h-7 w-px shrink-0 bg-ink/15" />
          <ul aria-label={`Quick filters for ${name}`} className="scrollbar-none relative -my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
            {chips.map((c) => (
              <li key={c.id} className="shrink-0" style={{ viewTransitionName: `chip-${c.id}` }}>
                <button
                  type="button"
                  aria-pressed={c.on}
                  onClick={() => toggleTheme(c.id)}
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink/15 bg-fog py-2 pr-4 pl-3 font-display text-[0.92rem] font-medium transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-fog"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-4 place-items-center rounded-full border border-ink/30 text-[0.6rem] text-transparent transition-colors group-aria-pressed:border-jade group-aria-pressed:bg-jade group-aria-pressed:text-river-deep"
                  >
                    <CheckIcon />
                  </span>
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
          {active ? (
            <button type="button" onClick={() => apply(EMPTY)} className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[0.85rem] font-medium text-moss transition-colors hover:text-ink sm:inline-flex">
              <CrossIcon />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="wrap flex flex-col gap-10 pt-8 pb-4">
        <div aria-live="polite" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.95rem] text-moss">
          <span>
            <span className="font-semibold text-ink tabular-nums">{results.length}</span> {results.length === 1 ? "tour" : "tours"}
            {active ? "" : ` in ${name}`}
          </span>
          {active ? (
            <button type="button" onClick={() => apply(EMPTY)} className="cursor-pointer text-[0.85rem] font-medium text-ink underline underline-offset-4 sm:hidden">
              Clear filters
            </button>
          ) : null}
        </div>

        {shown.length ? (
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((listing, i) => (
              <Cell key={listing.id} listing={listing} interlude={i === INTERLUDE_AFTER - 1 && shown.length > INTERLUDE_AFTER ? interlude : null} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-4 rounded-tl-[2rem] rounded-br-[2rem] bg-fog p-8">
            <p className="font-display text-[1.3rem] font-semibold">Nothing matches that mix yet.</p>
            <button type="button" onClick={() => apply(EMPTY)} className="cursor-pointer font-display font-semibold underline decoration-mandarin decoration-2 underline-offset-[6px]">
              Clear filters
            </button>
          </div>
        )}

        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => withTransition(() => setLimit((n) => n + PAGE))}
            className="group mx-auto inline-flex cursor-pointer items-center gap-3 rounded-full border border-ink/20 py-2 pr-2 pl-6 font-display font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-fog"
          >
            Show {Math.min(PAGE, remaining)} more
            <span className="grid size-9 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:bg-fog group-hover:text-ink">
              <ArrowRightIcon />
            </span>
          </button>
        ) : null}
      </div>

      <FilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        applied={filters}
        themes={themeOptions}
        durations={durationOptions}
        countFor={countFor}
        onApply={(f) => apply(f)}
      />
    </div>
  );
}

/** One grid cell, followed by the content card when it is due. */
function Cell({ listing, interlude }: { listing: DestinationListing; interlude: Props["interlude"] | null }) {
  return (
    <>
      <li style={{ viewTransitionName: `res-${listing.id.replace(/[^a-zA-Z0-9-]/g, "-")}` }}>
        <TourCard listing={listing} gallery summary rowOnPhone sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 34vw" />
      </li>
      {interlude ? (
        <li style={{ viewTransitionName: "res-interlude" }}>
          <aside className="relative flex h-full min-h-[22rem] flex-col justify-between gap-8 overflow-hidden rounded-tr-[2.25rem] rounded-bl-[2.25rem] bg-river-deep p-7 text-fog">
            {/* Contour lines, drawn once — a quiet nod to the hills. */}
            <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -right-16 -bottom-16 size-72 text-jade/15">
              {[90, 72, 54, 36, 18].map((r) => (
                <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
              ))}
            </svg>
            <div className="relative flex flex-col gap-4">
              <p className="font-display text-[1.6rem] leading-[1.08] font-bold tracking-[-0.02em]">{interlude.title}</p>
              <p className="text-[0.92rem] leading-relaxed text-fog/70">{interlude.text}</p>
            </div>
            <a
              href="#enquiry"
              className="group relative inline-flex items-center justify-between gap-3 self-start rounded-full bg-mandarin py-2 pr-2 pl-5 font-display font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
            >
              {interlude.cta}
              <span className="grid size-9 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                <ArrowRightIcon />
              </span>
            </a>
          </aside>
        </li>
      ) : null}
    </>
  );
}
