"use client";

/**
 * The booking core: 01 date → 02 package → 03 travellers, a live price summary,
 * and the selected package's details (itinerary, stays, what's in it).
 * Nothing is charged online yet: "Request to book" hands the selection to the
 * enquiry form (and WhatsApp). Online payment plugs in at `onRequest` later.
 */
import * as Tabs from "@radix-ui/react-tabs";
import Image from "next/image";
import { useId, useMemo, useState } from "react";
import type { ExperiencePackage } from "@/content/experiences/schema";
import { ENQUIRY_PREFILL_EVENT } from "@/features/enquiry/enquiry-form";
import { DatePicker } from "@/ui/date-picker";
import { ArrowRightIcon, CheckIcon, MinusIcon, PlusIcon, StarIcon, WhatsAppIcon } from "@/ui/icons";
import { formatFullDate, formatInr, plural, savingPercent } from "./format";
import { ItineraryTimeline } from "./itinerary-timeline";
import { PER_UNIT_MAX, groupRange, initialSelection, optionFor, quote, type Selection } from "./pricing";

type PackagePickerProps = {
  experienceTitle: string;
  packages: ExperiencePackage[];
  whatsappHref: string;
};

export function PackagePicker({ experienceTitle, packages, whatsappHref }: PackagePickerProps) {
  const uid = useId();
  const [active, setActive] = useState(0);
  const pkg = packages[active] ?? packages[0];
  const [selection, setSelection] = useState<Selection>(() => initialSelection(pkg));
  const [date, setDate] = useState<string>();
  const q = useMemo(() => quote(pkg, selection), [pkg, selection]);

  const choosePackage = (i: number) => {
    const next = packages[i];
    if (!next) return;
    setActive(i);
    setSelection(initialSelection(next, q.travellers || 2));
  };

  const message = [
    `Booking request: ${experienceTitle}`,
    `Package: ${pkg.name}`,
    `Date: ${date ? formatFullDate(date) : "Not chosen yet"}`,
    `Travellers: ${selection.mode === "group" ? plural(q.travellers, "person", "people") : q.lines.map((l) => `${l.qty} × ${l.label}`).join(", ") || "—"}`,
    q.total != null ? `Quoted total: ${formatInr(q.total)}` : "Quote needed for this group size",
  ].join("\n");

  const onRequest = () => {
    window.dispatchEvent(new CustomEvent(ENQUIRY_PREFILL_EVENT, { detail: { message } }));
  };

  const waHref = withText(whatsappHref, message);
  const saving = q.total != null ? savingPercent(q.total, q.compareAt ?? undefined) : 0;

  return (
    <section id="packages" aria-labelledby="packages-title" className="scroll-mt-32 md:scroll-mt-44 bg-cloud py-20 md:py-28">
      <div className="wrap flex flex-col gap-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-3">
            <span className="label text-moss">Reserve now · pay later</span>
            <h2 id="packages-title" data-motion="lines" className="font-display text-title font-bold tracking-[-0.03em]">
              Choose your package
            </h2>
          </div>
          <p className="max-w-[40ch] text-[0.95rem] text-moss">Pick a date, a package and your group size. The price updates as you go.</p>
        </header>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-14">
          {/* Steps */}
          <div className="flex min-w-0 flex-col gap-10 lg:col-span-7">
            <Step n="01" title="When are you going?" htmlFor={`${uid}-date`}>
              <div className="rounded-2xl bg-fog px-5 py-1">
                <DatePicker id={`${uid}-date`} name="experienceDate" placeholder="Select a date" minDaysFromToday={1} onPick={setDate} />
              </div>
            </Step>

            <Step n="02" title="Package type" as="fieldset">
              <div className="flex flex-col gap-3">
                {packages.map((p, i) => (
                  <PackageOption key={p.id} pkg={p} name={`${uid}-pkg`} checked={i === active} onChange={() => choosePackage(i)} />
                ))}
              </div>
            </Step>

            <Step n="03" title={selection.mode === "group" ? "Group size" : "Tickets"} as="fieldset">
              {selection.mode === "group" ? (
                <GroupStepper pkg={pkg} travellers={selection.travellers} onChange={(n) => setSelection({ mode: "group", travellers: n })} />
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
                      onChange={(n) => setSelection({ mode: "per-unit", counts: { ...selection.counts, [o.id]: n } })}
                    />
                  ))}
                </div>
              )}
            </Step>
          </div>

          {/* Live summary: sticky beside the steps from lg up. */}
          <aside aria-label="Your selection" className="lg:sticky lg:top-48 lg:col-span-5 lg:row-span-2 lg:self-start">
            <div className="flex flex-col gap-6 rounded-tl-[2.25rem] rounded-br-[2.25rem] bg-ink p-6 text-fog md:p-7">
              <div className="flex flex-col gap-1">
                <span className="label text-jade">Your selection</span>
                <p className="font-display text-[1.2rem] leading-tight font-semibold">{pkg.name}</p>
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[0.9rem]">
                <dt className="text-fog/60">Date</dt>
                <dd className="text-right">{date ? formatFullDate(date) : <span className="text-fog/50">Not chosen</span>}</dd>
                <dt className="text-fog/60">Travellers</dt>
                <dd className="text-right tabular-nums">{q.travellers ? plural(q.travellers, "person", "people") : "—"}</dd>
                {q.lines.map((l) => (
                  <div key={l.label} className="col-span-2 grid grid-cols-subgrid">
                    <dt className="text-fog/60">{selection.mode === "per-unit" ? `${l.qty} × ${l.label}` : l.label}</dt>
                    <dd className="text-right font-mono tabular-nums">{formatInr(l.amount)}</dd>
                  </div>
                ))}
              </dl>

              <div className="border-t border-dashed border-white/20 pt-5" aria-live="polite">
                {q.total != null ? (
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="label text-fog/60">Total</span>
                      <span key={q.total} className="font-display text-[clamp(2.2rem,4vw,3rem)] leading-none font-bold tracking-[-0.03em] tabular-nums motion-safe:animate-[fade-in_0.4s_var(--ease-out-expo)]">
                        {formatInr(q.total)}
                      </span>
                      {q.travellers > 1 ? (
                        <span className="font-mono text-[0.75rem] text-fog/60 tabular-nums">≈ {formatInr(q.total / q.travellers)} per person</span>
                      ) : null}
                    </div>
                    {q.compareAt ? (
                      <div className="flex flex-col items-end gap-1">
                        {saving ? <span className="rounded-full bg-jade px-2.5 py-0.5 label text-river-deep">Save {saving}%</span> : null}
                        <s className="font-mono text-[0.85rem] text-fog/50 tabular-nums">{formatInr(q.compareAt)}</s>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[0.95rem] text-fog/80">
                    {selection.mode === "per-unit" ? "Add at least one ticket to see the price." : "Tell us your group size and we’ll send a quote."}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <a
                  href="#enquiry"
                  onClick={onRequest}
                  className="group inline-flex items-center justify-between gap-3 rounded-full bg-mandarin py-2.5 pr-2.5 pl-6 font-display text-[1.05rem] font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
                >
                  Request to book
                  <span className="grid size-10 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                    <ArrowRightIcon />
                  </span>
                </a>
                {waHref ? (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-[0.9rem] transition-colors hover:border-jade hover:text-jade"
                  >
                    <WhatsAppIcon className="text-lg" />
                    Ask on WhatsApp
                  </a>
                ) : null}
              </div>
              <p className="text-[0.8rem] leading-relaxed text-fog/55">No payment now. We confirm availability and send the final price first.</p>
            </div>
          </aside>

          {/* Details of the selected package. Re-keyed so it animates on change. */}
          <div id="itinerary" className="scroll-mt-32 md:scroll-mt-44 min-w-0 lg:col-span-7">
            <PackageDetails key={pkg.id} pkg={pkg} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, as = "div", htmlFor, children }: { n: string; title: string; as?: "div" | "fieldset"; htmlFor?: string; children: React.ReactNode }) {
  const heading = (
    <span className="flex items-baseline gap-3">
      <span className="font-mono text-[0.8rem] text-mandarin tabular-nums">{n}</span>
      <span className="font-display text-[1.25rem] font-semibold tracking-[-0.01em]">{title}</span>
    </span>
  );
  if (as === "fieldset") {
    return (
      <fieldset className="flex min-w-0 flex-col gap-4">
        <legend className="mb-4">{heading}</legend>
        {children}
      </fieldset>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {htmlFor ? <label htmlFor={htmlFor}>{heading}</label> : heading}
      {children}
    </div>
  );
}

function PackageOption({ pkg, name, checked, onChange }: { pkg: ExperiencePackage; name: string; checked: boolean; onChange: () => void }) {
  const cheapest = pkg.priceOptions.reduce((a, b) => (b.price < a.price ? b : a));
  const from = pkg.pricingMode === "per-unit" ? "per person" : `for ${cheapest.label}`;
  return (
    <label className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-ink/12 bg-fog p-5 transition-[background-color,border-color,color] duration-300 hover:border-ink/40 has-checked:border-ink has-checked:bg-ink has-checked:text-fog has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-mandarin md:p-6">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className="flex items-start justify-between gap-4">
        <span className="flex min-w-0 flex-col gap-1.5">
          {pkg.tag ? <span className="label text-mandarin">{pkg.tag}</span> : null}
          <span className="font-display text-[1.1rem] leading-snug font-semibold">{pkg.name}</span>
          {pkg.summary ? <span className="text-[0.9rem] text-moss group-has-checked:text-fog/70">{pkg.summary}</span> : null}
        </span>
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-ink/25 text-[0.9rem] text-transparent transition-colors group-has-checked:border-jade group-has-checked:bg-jade group-has-checked:text-river-deep">
          <CheckIcon />
        </span>
      </span>
      <span className="flex flex-wrap items-end justify-between gap-3">
        <span className="flex flex-wrap gap-1.5">
          {pkg.chips.slice(0, 3).map((c) => (
            <span key={c} className="rounded-full bg-ink/6 px-2.5 py-1 text-[0.75rem] group-has-checked:bg-white/10">
              {c}
            </span>
          ))}
        </span>
        <span className="flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-[0.8rem] text-moss group-has-checked:text-fog/60">From</span>
          <span className="font-mono text-[1rem] font-semibold tabular-nums">{formatInr(cheapest.price)}</span>
          <span className="text-[0.8rem] text-moss group-has-checked:text-fog/60">{from}</span>
        </span>
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

function PackageDetails({ pkg }: { pkg: ExperiencePackage }) {
  const tabs = [
    { id: "itinerary", label: "Itinerary" },
    ...(pkg.hotels.length ? [{ id: "stays", label: "Stays" }] : []),
    { id: "glance", label: "At a glance" },
  ];
  return (
    <div className="flex flex-col gap-6 rounded-tl-[2.25rem] rounded-br-[2.25rem] bg-fog p-6 motion-safe:animate-[fade-in_0.5s_var(--ease-out-expo)] md:p-8">
      <div className="flex flex-col gap-1">
        <span className="label text-moss">Itinerary &amp; details · changes with the package</span>
        <h3 className="font-display text-[1.4rem] leading-tight font-semibold tracking-[-0.01em]">{pkg.name}</h3>
      </div>
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
            <ul className="grid gap-4 sm:grid-cols-2">
              {pkg.hotels.map((h) => (
                <li key={`${h.place}-${h.name}`} className="flex flex-col overflow-hidden rounded-2xl bg-cloud">
                  {h.image ? (
                    <div className="relative aspect-[16/10]">
                      <Image src={h.image.src} alt={h.image.alt} fill sizes="(min-width: 640px) 320px, 90vw" className="object-cover" />
                    </div>
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
              ))}
            </ul>
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

const WHATSAPP_HOSTS = new Set(["wa.me", "api.whatsapp.com"]);

/** Same WhatsApp chat, with the selection as the opening message. Anything that is not a WhatsApp https link gives null (no button). */
function withText(href: string, text: string): string | null {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" || !WHATSAPP_HOSTS.has(url.hostname)) return null;
    // encodeURIComponent (spaces as %20): some WhatsApp clients show "+" literally.
    return `${url.origin}${url.pathname}?text=${encodeURIComponent(text)}`;
  } catch {
    return null;
  }
}
