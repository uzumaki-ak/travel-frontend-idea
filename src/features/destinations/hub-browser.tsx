"use client";

/**
 * The hub's main list: tours, experiences, cabs and attractions in one grid,
 * under a sticky bar with a "Filters" button and quick chips.
 *
 *  - "Filters" opens the full panel (bottom sheet on phones, right panel on
 *    tablet up): Type, Themes and Duration. Quick chips toggle the same filters.
 *  - Within a group, picks widen the results (OR); across groups they narrow (AND).
 *    Tours matching more picked themes come first, then the hub's own `rank`;
 *    then cabs, then attractions.
 *  - Tapping an attraction shows the tours that visit it, with a way back.
 *  - Everything updates in place (no URL change). 8 at a time, then "Show more".
 *  - Changes morph the cards into place with the View Transitions API where
 *    available; elsewhere, or with reduced motion, they just update.
 */
import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Destination, DestinationAttraction, DestinationListing, HubCabCard } from "@/content/destinations/schema";
import { ArrowRightIcon, CheckIcon, CrossIcon } from "@/ui/icons";
import { EMPTY, FilterSheet, type Duration, type Filters, type Kind } from "./filter-sheet";
import { AttractionCard, CabCard } from "./result-cards";
import { TourCard } from "./tour-card";

const PAGE = 8;
/** The content card sits after this many results ("content in between"). */
const INTERLUDE_AFTER = 5;

const KIND_LABEL: Record<Kind, string> = { tour: "Tours", experience: "Experiences", cab: "Cabs", attraction: "Attractions" };
const DURATION_LABEL: Record<Duration, string> = { day: "A day or less", short: "2–3 days", long: "4 days or more" };

type Item =
  | { kind: "tour" | "experience"; key: string; listing: DestinationListing }
  | { kind: "cab"; key: string; cab: HubCabCard }
  | { kind: "attraction"; key: string; attraction: DestinationAttraction; tours: number };

type Props = Pick<Destination, "name" | "categories" | "listings" | "interlude" | "attractions"> & { cabs: HubCabCard[] };

const durationOf = (l: DestinationListing): Duration => (l.days <= 1 ? "day" : l.days <= 3 ? "short" : "long");
const visits = (l: DestinationListing, stops: string[]) => l.route.some((r) => stops.includes(r));
const filterCount = (f: Filters) => f.types.length + f.themes.length + f.durations.length;

/** Does an item pass the filters? Returns its theme-hit count (for ordering), or -1 to drop it. */
function score(item: Item, f: Filters): number {
  if (f.types.length && !f.types.includes(item.kind)) return -1;
  const cats = item.kind === "cab" ? [] : item.kind === "attraction" ? item.attraction.categories : item.listing.categories;
  const hits = cats.filter((c) => f.themes.includes(c)).length;
  if (f.themes.length && hits === 0) return -1;
  if (f.durations.length && (item.kind === "cab" || item.kind === "attraction" || !f.durations.includes(durationOf(item.listing)))) return -1;
  return hits;
}

function select(items: Item[], f: Filters): Item[] {
  const order: Record<Kind, number> = { tour: 0, experience: 0, cab: 1, attraction: 2 };
  return items
    .map((item, i) => ({ item, i, s: score(item, f) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => order[a.item.kind] - order[b.item.kind] || b.s - a.s || a.i - b.i)
    .map((x) => x.item);
}

function withTransition(update: () => void) {
  // Phones skip the reflow animation: its snapshots draw above the fixed header and
  // enquiry bar, and the jump back to the list top makes them glitch.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce), (max-width: 767px)").matches;
  if (reduced || typeof document.startViewTransition !== "function") return update();
  document.startViewTransition(() => flushSync(update));
}

export function HubBrowser({ name, categories, listings, interlude, attractions, cabs }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [visiting, setVisiting] = useState<DestinationAttraction | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // Listings are already in rank order.
  const items = useMemo<Item[]>(
    () => [
      ...listings.map((l): Item => ({ kind: l.days <= 1 ? "experience" : "tour", key: `l-${l.id}`, listing: l })),
      ...cabs.map((c): Item => ({ kind: "cab", key: `c-${c.slug}`, cab: c })),
      ...attractions.map((a): Item => ({ kind: "attraction", key: `a-${a.name}`, attraction: a, tours: listings.filter((l) => visits(l, a.stops)).length })),
    ],
    [listings, cabs, attractions],
  );

  const results = useMemo(() => {
    if (!visiting) return select(items, filters);
    // An attraction narrows to the tours and experiences that visit it (themes and duration still apply).
    const tourItems = items.filter((i) => (i.kind === "tour" || i.kind === "experience") && visits(i.listing, visiting.stops));
    return select(tourItems, { ...filters, types: [] });
  }, [items, filters, visiting]);

  const countFor = (f: Filters) => select(items, f).length;

  // Option lists with totals (how many items carry each option).
  const typeOptions = (Object.keys(KIND_LABEL) as Kind[]).map((id) => ({ id, label: KIND_LABEL[id], count: items.filter((i) => i.kind === id).length })).filter((o) => o.count > 0);
  const themeOptions = categories.map((c) => ({
    id: c.id,
    label: c.label,
    count: items.filter((i) => (i.kind === "attraction" ? i.attraction.categories : i.kind === "cab" ? [] : i.listing.categories).includes(c.id)).length,
  }));
  const durationOptions = (Object.keys(DURATION_LABEL) as Duration[]).map((id) => ({ id, label: DURATION_LABEL[id], count: listings.filter((l) => durationOf(l) === id).length })).filter((o) => o.count > 0);

  const backToTop = () =>
    requestAnimationFrame(() => {
      const el = top.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
    });
  const apply = (next: Filters, nextVisiting: DestinationAttraction | null = null) => {
    withTransition(() => {
      setFilters(next);
      setVisiting(nextVisiting);
      setLimit(PAGE);
    });
    backToTop();
  };
  const toggleQuick = (key: "types" | "themes", id: string) => {
    const list = filters[key] as string[];
    apply({ ...filters, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] }, visiting);
  };

  // Quick chips: picked ones first (in the order picked), then the rest. Types before themes.
  const quick = [
    ...typeOptions.map((o) => ({ key: "types" as const, id: o.id, label: o.label, on: filters.types.includes(o.id) })),
    ...themeOptions.map((o) => ({ key: "themes" as const, id: o.id, label: o.label, on: filters.themes.includes(o.id) })),
  ];
  const pickedOrder = [...filters.types, ...filters.themes];
  const chips = [...quick.filter((c) => c.on).sort((a, b) => pickedOrder.indexOf(a.id) - pickedOrder.indexOf(b.id)), ...quick.filter((c) => !c.on)];

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
              <li key={`${c.key}-${c.id}`} className="shrink-0" style={{ viewTransitionName: `chip-${c.key}-${c.id}` }}>
                <button
                  type="button"
                  aria-pressed={c.on}
                  onClick={() => toggleQuick(c.key, c.id)}
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
          {active || visiting ? (
            <button type="button" onClick={() => apply(EMPTY)} className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[0.85rem] font-medium text-moss transition-colors hover:text-ink sm:inline-flex">
              <CrossIcon />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="wrap flex flex-col gap-10 pt-8 pb-4">
        <div aria-live="polite" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.95rem] text-moss">
          {visiting ? (
            <>
              <span>
                <span className="font-semibold text-ink tabular-nums">{results.length}</span> {results.length === 1 ? "tour visits" : "tours visit"}{" "}
                <span className="font-semibold text-ink">{visiting.name}</span>
              </span>
              <button type="button" onClick={() => apply(filters)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/20 px-3 py-1 text-[0.85rem] font-medium text-ink transition-colors hover:border-ink">
                <CrossIcon />
                Show everything
              </button>
            </>
          ) : (
            <span>
              <span className="font-semibold text-ink tabular-nums">{results.length}</span> {results.length === 1 ? "result" : "results"}
              {active ? "" : ` in ${name}`}
            </span>
          )}
          {active ? (
            <button type="button" onClick={() => apply(EMPTY)} className="cursor-pointer text-[0.85rem] font-medium text-ink underline underline-offset-4 sm:hidden">
              Clear filters
            </button>
          ) : null}
        </div>

        {shown.length ? (
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((item, i) => (
              <Cell
                key={item.key}
                item={item}
                onPick={(a) => apply(filters, a)}
                interlude={!visiting && i === INTERLUDE_AFTER - 1 && shown.length > INTERLUDE_AFTER ? interlude : null}
              />
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
        types={typeOptions}
        themes={themeOptions}
        durations={durationOptions}
        countFor={countFor}
        onApply={(f) => apply(f)}
      />
    </div>
  );
}

/** One grid cell, followed by the content card when it is due. */
function Cell({ item, onPick, interlude }: { item: Item; onPick: (a: DestinationAttraction) => void; interlude: Props["interlude"] | null }) {
  return (
    <>
      <li style={{ viewTransitionName: `res-${item.key.replace(/[^a-zA-Z0-9-]/g, "-")}` }}>
        {item.kind === "cab" ? (
          <CabCard cab={item.cab} />
        ) : item.kind === "attraction" ? (
          <AttractionCard attraction={item.attraction} tours={item.tours} onPick={() => onPick(item.attraction)} />
        ) : (
          <TourCard listing={item.listing} gallery summary rowOnPhone sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 34vw" />
        )}
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
