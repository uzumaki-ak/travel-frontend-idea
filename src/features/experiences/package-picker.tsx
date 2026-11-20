"use client";

/**
 * The booking core: 01 package → 02 travellers, a live price summary,
 * and the selected package's details (itinerary, stays, what's in it).
 * Nothing is charged online yet: "Book now" opens the enquiry popup with the
 * selection filled in. The pick is shared (selection-store) so the price ticket,
 * the phone bar and the popup show it. Online payment plugs in at `onBook` later.
 */
import * as Tabs from "@radix-ui/react-tabs";
import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import type { ExperiencePackage, PackageHotel } from "@/content/experiences/schema";
import { ArrowRightIcon, CheckIcon, GridIcon, MinusIcon, PlusIcon, StarIcon } from "@/ui/icons";
import { Lightbox } from "./experience-gallery";
import { formatInr, plural } from "./format";
import { ItineraryTimeline } from "./itinerary-timeline";
import { prefillBooking, setPackageSelection, type PackageSelection } from "./selection-store";
import { PER_UNIT_MAX, groupRange, initialSelection, optionFor, quote, type Selection } from "./pricing";

type PackagePickerProps = {
  experienceTitle: string;
  packages: ExperiencePackage[];
};

export function PackagePicker({ experienceTitle, packages }: PackagePickerProps) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const pkg = packages[active] ?? packages[0];
  const [selection, setSelection] = useState<Selection>(() => initialSelection(pkg));
  // False until the visitor picks a package or changes travellers; until then the
  // ticket and the phone bar keep saying "Choose package".
  const [picked, setPicked] = useState(false);
  const q = useMemo(() => quote(pkg, selection), [pkg, selection]);

  const choosePackage = (i: number) => {
    const next = packages[i];
    if (!next) return;
    setPicked(true);
    setActive(i);
    setSelection(initialSelection(next, q.travellers || 2));
  };
  const changeTravellers = (next: Selection) => {
    setPicked(true);
    setSelection(next);
  };

  const message = [
    `Booking request: ${experienceTitle}`,
    `Package: ${pkg.name}`,
    `Travellers: ${selection.mode === "group" ? plural(q.travellers, "person", "people") : q.lines.map((l) => `${l.qty} × ${l.label}`).join(", ") || "—"}`,
    q.total != null ? `Quoted total: ${formatInr(q.total)}` : "Quote needed for this group size",
  ].join("\n");

  const snapshot: PackageSelection = {
    packageName: pkg.name,
    total: q.total ?? null,
    compareAt: q.compareAt ?? null,
    travellers: q.travellers ? plural(q.travellers, "person", "people") : "no travellers yet",
    message,
  };
  const snapshotKey = JSON.stringify(snapshot);

  // Share the pick with the ticket, the phone bar and the enquiry popup.
  useEffect(() => {
    if (picked) setPackageSelection(JSON.parse(snapshotKey) as PackageSelection);
  }, [picked, snapshotKey]);
  useEffect(() => () => setPackageSelection(null), []);

  // "Book now" on a card: counts as a pick, and fills the form right away.
  const onBook = () => {
    setPicked(true);
    setPackageSelection(snapshot);
    prefillBooking();
  };

  return (
    <section id="packages" aria-labelledby="packages-title" className="scroll-mt-32 md:scroll-mt-44 bg-cloud py-20 md:py-28">
      <div className="wrap flex flex-col gap-12">
        <h2 id="packages-title" data-motion="lines" className="font-display text-title font-bold tracking-[-0.03em]">
          Choose your package
        </h2>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-14">
          {/* Steps */}
          <div className="flex min-w-0 flex-col gap-10 lg:col-span-7">
            <Step n="01" title="Package type">
              {/* Phones: a swipe row (next card peeks in). Tablet up: a stacked list. */}
              <div className="scrollbar-none -mx-(--gutter-x) flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-(--gutter-x) px-(--gutter-x) pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
                {packages.map((p, i) => (
                  <PackageOption
                    key={p.id}
                    pkg={p}
                    name={`${uid}-pkg`}
                    checked={i === active}
                    onChange={() => choosePackage(i)}
                    bookHref="#enquiry"
                    onBook={onBook}
                  />
                ))}
              </div>
            </Step>

            <Step n="02" title={selection.mode === "group" ? "Group size" : "Tickets"}>
              {selection.mode === "group" ? (
                <GroupStepper pkg={pkg} travellers={selection.travellers} onChange={(n) => changeTravellers({ mode: "group", travellers: n })} />
              ) : (
                <div className="flex flex-col divide-y divide-ink/10 rounded-2xl bg-fog px-5">
                  {pkg.priceOptions.map((o) => (
                    <Counter
                      key={o.id}
                      label={o.label}
                      hint={formatInr(o.price)}
                      value={selection.counts[o.id] ?? 0}
                      min={0}
                      max={PER_UNIT_MAX}
                      onChange={(n) => changeTravellers({ mode: "per-unit", counts: { ...selection.counts, [o.id]: n } })}
                    />
                  ))}
                </div>
              )}
            </Step>
          </div>

          {/* Details of the selected package. Re-keyed so it animates on change. */}
          <div id="itinerary" className="scroll-mt-32 md:scroll-mt-44 min-w-0 lg:col-span-7">
            <PackageDetails key={pkg.id} pkg={pkg} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-4 flex items-baseline gap-3">
        <span className="font-mono text-[0.8rem] text-mandarin tabular-nums">{n}</span>
        <span className="font-display text-[1.25rem] font-semibold tracking-[-0.01em]">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

type PackageOptionProps = {
  pkg: ExperiencePackage;
  name: string;
  checked: boolean;
  onChange: () => void;
  /** Where "Book now" goes (only the selected card shows it). */
  bookHref: string;
  onBook: () => void;
};

function PackageOption({ pkg, name, checked, onChange, bookHref, onBook }: PackageOptionProps) {
  const cheapest = pkg.priceOptions.reduce((a, b) => (b.price < a.price ? b : a));
  const from = pkg.pricingMode === "per-unit" ? "per person" : `for ${cheapest.label}`;
  return (
    <label className="group relative flex w-[84%] shrink-0 cursor-pointer snap-start flex-col gap-3 rounded-2xl border border-ink/12 bg-fog p-5 transition-[background-color,border-color,color] duration-300 hover:border-ink/40 has-checked:border-ink has-checked:bg-ink has-checked:text-fog has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-mandarin md:w-auto md:p-6">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className="flex items-start justify-between gap-4">
        <span className="flex min-w-0 flex-col gap-1.5">
          {pkg.tag ? <span className="label text-mandarin">{pkg.tag}</span> : null}
          <span className="font-display text-[1.1rem] leading-snug font-semibold">{pkg.name}</span>
          <span className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-[0.8rem] text-moss group-has-checked:text-fog/60">From</span>
            <span className="font-mono text-[1.15rem] font-semibold tabular-nums">{formatInr(cheapest.price)}</span>
            <span className="text-[0.8rem] text-moss group-has-checked:text-fog/60">{from}</span>
          </span>
          {pkg.summary ? <span className="text-[0.9rem] text-moss group-has-checked:text-fog/70">{pkg.summary}</span> : null}
        </span>
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-ink/25 text-[0.9rem] text-transparent transition-colors group-has-checked:border-jade group-has-checked:bg-jade group-has-checked:text-river-deep">
          <CheckIcon />
        </span>
      </span>
      <span className="mt-auto flex flex-wrap items-end justify-between gap-3">
        <span className="flex flex-wrap gap-1.5">
          {pkg.chips.slice(0, 3).map((c) => (
            <span key={c} className="rounded-full bg-ink/6 px-2.5 py-1 text-[0.75rem] group-has-checked:bg-white/10">
              {c}
            </span>
          ))}
        </span>
        {checked ? (
          <a
            href={bookHref}
            {...(bookHref.startsWith("#") ? {} : { target: "_blank", rel: "noreferrer noopener" })}
            onClick={onBook}
            className="group/book inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-full bg-mandarin py-1.5 pr-1.5 pl-5 font-display font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
          >
            Book now
            <span className="grid size-8 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover/book:translate-x-1">
              <ArrowRightIcon />
            </span>
          </a>
        ) : null}
      </span>
    </label>
  );
}

function GroupStepper({ pkg, travellers, onChange }: { pkg: ExperiencePackage; travellers: number; onChange: (n: number) => void }) {
  const { min, max } = groupRange(pkg);
  const option = optionFor(pkg, travellers);
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-fog px-5">
        <Counter label="Travellers" hint={`${min} – ${max} people`} value={travellers} min={min} max={max} onChange={onChange} />
      </div>
      {pkg.priceOptions.length > 1 ? (
        // Bracket scale: shows which price band the group falls into.
        <ol aria-label="Price by group size" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${pkg.priceOptions.length}, minmax(0, 1fr))` }}>
          {pkg.priceOptions.map((o) => {
            const on = o.id === option?.id;
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onChange(Math.max(o.guests.min, Math.min(o.guests.max, travellers)))}
                  aria-pressed={on}
                  className="flex w-full flex-col gap-1 rounded-xl border border-ink/12 px-2 py-2.5 text-left transition-colors hover:border-ink/40 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-fog"
                >
                  <span className="truncate font-mono text-[0.7rem] tabular-nums opacity-70">{o.label}</span>
                  <span className="truncate font-mono text-[0.85rem] font-semibold tabular-nums">{formatInr(o.price)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}

function Counter({ label, hint, value, min, max, onChange }: { label: string; hint?: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="flex flex-col">
        <span id={id} className="font-medium">
          {label}
        </span>
        {hint ? <span className="font-mono text-[0.75rem] text-moss tabular-nums">{hint}</span> : null}
      </span>
      <span className="flex items-center gap-3" role="group" aria-labelledby={id}>
        <button type="button" aria-label={`Fewer: ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid size-10 place-items-center rounded-full border border-ink/20 text-lg transition-colors hover:border-ink hover:bg-ink hover:text-fog disabled:pointer-events-none disabled:opacity-30">
          <MinusIcon />
        </button>
        <output aria-live="polite" className="w-7 text-center font-mono text-[1.05rem] tabular-nums">
          {value}
        </output>
        <button type="button" aria-label={`More: ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid size-10 place-items-center rounded-full border border-ink/20 text-lg transition-colors hover:border-ink hover:bg-ink hover:text-fog disabled:pointer-events-none disabled:opacity-30">
          <PlusIcon />
        </button>
      </span>
    </div>
  );
}

/**
 * Stays: a swipe row on phones, a two-column grid from sm up. A stay can carry
 * several photos; tapping the photo opens them all in the lightbox.
 */
function HotelList({ hotels }: { hotels: PackageHotel[] }) {
  const [viewer, setViewer] = useState<{ name: string; photos: { src: string; alt: string }[] } | null>(null);
  const [index, setIndex] = useState(0);
  return (
    <>
      <ul className="scrollbar-none -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-6 px-6 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
        {hotels.map((h) => {
          const photos = hotelPhotos(h);
          const cover = photos[0];
          return (
            <li key={`${h.place}-${h.name}`} className="flex w-[80%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-cloud sm:w-auto">
              {cover ? (
                <button
                  type="button"
                  onClick={() => {
                    setIndex(0);
                    setViewer({ name: h.name, photos });
                  }}
                  aria-label={`View ${photos.length > 1 ? `${photos.length} photos` : "photo"} of ${h.name}`}
                  className="group relative aspect-[16/10] cursor-pointer overflow-hidden focus-visible:outline-offset-[-3px]"
                >
                  <Image src={cover.src} alt="" fill sizes="(min-width: 640px) 320px, 80vw" className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.04]" />
                  {photos.length > 1 ? (
                    <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-fog/90 px-3 py-1.5 text-[0.8rem] font-medium text-ink backdrop-blur">
                      <GridIcon />
                      {photos.length} photos
                    </span>
                  ) : null}
                </button>
              ) : null}
              <div className="flex flex-col gap-1.5 p-5">
                <span className="label text-moss">
                  {h.place}
                  {h.nights ? ` · ${plural(h.nights, "night", "nights")}` : ""}
                </span>
                <span className="font-medium">{h.name}</span>
                {h.stars ? (
                  <span className="flex items-center gap-0.5 text-[0.85rem] text-mandarin" aria-label={`${h.stars}-star hotel`}>
                    {Array.from({ length: h.stars }, (_, i) => (
                      <StarIcon key={i} />
                    ))}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {viewer ? (
        <Lightbox
          photos={viewer.photos}
          title={viewer.name}
          open
          onOpenChange={(o) => !o && setViewer(null)}
          index={index}
          setIndex={setIndex}
        />
      ) : null}
    </>
  );
}

/** The stay's photos: the single `image` (older data) followed by `images`. */
function hotelPhotos(h: PackageHotel) {
  return [...(h.image ? [h.image] : []), ...h.images];
}

function PackageDetails({ pkg }: { pkg: ExperiencePackage }) {
  const tabs = [
    { id: "itinerary", label: "Itinerary" },
    ...(pkg.hotels.length ? [{ id: "stays", label: "Stays" }] : []),
    { id: "glance", label: "At a glance" },
  ];
  return (
    <div className="flex flex-col gap-6 rounded-tl-[2.25rem] rounded-br-[2.25rem] bg-fog p-6 motion-safe:animate-[fade-in_0.5s_var(--ease-out-expo)] md:p-8">
      <h3 className="font-display text-[1.4rem] leading-tight font-semibold tracking-[-0.01em]">{pkg.name}</h3>
      <Tabs.Root defaultValue="itinerary" className="flex flex-col gap-7">
        <Tabs.List aria-label="Package details" className="flex gap-6 border-b border-ink/12">
          {tabs.map((t) => (
            <Tabs.Trigger
              key={t.id}
              value={t.id}
              className="relative -mb-px pb-3 font-display text-[0.98rem] font-medium text-moss transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-500 after:ease-out-expo hover:text-ink data-[state=active]:text-ink data-[state=active]:after:scale-x-100"
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="itinerary" className="focus-visible:outline-offset-8">
          <ItineraryTimeline days={pkg.itinerary} />
        </Tabs.Content>

        {pkg.hotels.length ? (
          <Tabs.Content value="stays" className="focus-visible:outline-offset-8">
            <HotelList hotels={pkg.hotels} />
          </Tabs.Content>
        ) : null}

        <Tabs.Content value="glance" className="focus-visible:outline-offset-8">
          <ul className="grid gap-3 sm:grid-cols-2">
            {pkg.chips.map((c) => (
              <li key={c} className="flex items-start gap-3 text-[0.95rem]">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-jade text-[0.75rem] text-river-deep">
                  <CheckIcon />
                </span>
                {c}
              </li>
            ))}
            <li className="flex items-start gap-3 text-[0.95rem]">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-jade text-[0.75rem] text-river-deep">
                <CheckIcon />
              </span>
              {plural(pkg.itinerary.length, "day", "days")} · {plural(pkg.itinerary.reduce((n, d) => n + d.stops.filter((s) => s.kind === "visit").length, 0), "stop", "stops")}
            </li>
          </ul>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
