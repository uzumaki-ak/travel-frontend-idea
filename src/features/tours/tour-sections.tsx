import type { HotelTier, ItineraryDay, MainSection } from "@/content/tours";
import {
  BedIcon,
  BinocularsIcon,
  CarIcon,
  CheckIcon,
  CupIcon,
  DepartIcon,
  MoonIcon,
  PaddleIcon,
  PinIcon,
  TentIcon,
} from "@/ui/icons";
import { ContentBlocks } from "./content-blocks";

/** One wrapper for every section so spacing and headings stay identical. */
export function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex scroll-mt-28 flex-col gap-6 border-t border-ink/10 pt-10 first:border-t-0 first:pt-0">
      {title ? (
        <h2 data-motion="lines" className="font-display text-title font-semibold tracking-[-0.02em]">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

export function MainSectionView({ section }: { section: MainSection }) {
  switch (section.kind) {
    case "includes":
      return (
        <SectionShell title={section.title}>
          <ul className="flex flex-wrap gap-2.5">
            {section.items.map((item) => {
              const Icon = INCLUDE_ICONS[item] ?? CheckIcon;
              return (
                <li key={item} data-motion="rise" className="flex items-center gap-2.5 rounded-full bg-cloud py-2 pr-4 pl-2.5">
                  <span className="grid size-8 place-items-center rounded-full bg-river text-[1.05rem] text-jade">
                    <Icon />
                  </span>
                  <span className="text-[0.95rem] font-medium">{item}</span>
                </li>
              );
            })}
          </ul>
        </SectionShell>
      );
    case "highlights":
      return (
        <SectionShell title={section.title}>
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {section.items.map((item) => (
              <li key={item} data-motion="rise" className="flex gap-3 text-[1rem] leading-relaxed">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-jade/40 text-[0.85rem] text-river">
                  <CheckIcon />
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </SectionShell>
      );
    case "itinerary":
      return (
        <SectionShell title={section.title}>
          <Itinerary days={section.days} />
        </SectionShell>
      );
    case "hotels":
      return (
        <SectionShell title={section.title}>
          <Hotels tiers={section.tiers} />
        </SectionShell>
      );
    case "generic":
      return (
        <SectionShell title={section.title}>
          <ContentBlocks blocks={section.blocks} />
        </SectionShell>
      );
  }
}

const INCLUDE_ICONS: Record<string, typeof CheckIcon> = {
  Hotel: BedIcon,
  Transportation: CarIcon,
  Breakfast: CupIcon,
  Camping: TentIcon,
  Sightseeing: BinocularsIcon,
  Activities: PaddleIcon,
};

/** "Day 1 : Arrival and Pickup" → ["Day 1", "Arrival and Pickup"]; other titles stay whole. */
function splitDayTitle(title: string): [string | null, string] {
  const match = title.match(/^(Day\s*\d+)\s*[:\-–]\s*(.+)$/i);
  return match ? [match[1], match[2]] : [null, title];
}

function noteIcon(note: string) {
  if (/^breakfast/i.test(note)) return CupIcon;
  if (/overnight/i.test(note)) return MoonIcon;
  if (/^departure/i.test(note)) return DepartIcon;
  return PinIcon;
}

function Itinerary({ days }: { days: ItineraryDay[] }) {
  return (
    <ol className="relative flex flex-col gap-10">
      {/* The spine draws itself as the reader scrolls (data-motion="draw"). */}
      <span aria-hidden="true" className="absolute top-2 bottom-2 left-[0.6875rem] w-px bg-ink/10">
        <span data-motion="draw" className="absolute inset-0 origin-top bg-mandarin" />
      </span>

      {days.map((day, i) => {
        const [dayLabel, dayTitle] = day.title ? splitDayTitle(day.title) : [null, ""];
        return (
          <li key={i} className="relative grid grid-cols-[1.375rem_1fr] gap-x-5">
            <span aria-hidden="true" className="relative z-10 mt-1 grid size-[1.375rem] place-items-center rounded-full border-2 border-mandarin bg-fog">
              <span className="size-1.5 rounded-full bg-mandarin" />
            </span>
            <div className="flex min-w-0 flex-col gap-3">
              {day.title ? (
                <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {dayLabel ? <span className="label text-mandarin">{dayLabel}</span> : null}
                  <span className="font-display text-[1.3rem] font-semibold tracking-[-0.01em]">{dayTitle}</span>
                </h3>
              ) : null}
              <ul className="flex flex-col gap-2">
                {day.items.map((item, j) => (
                  <li key={j} className="max-w-[68ch] text-[1rem] leading-relaxed text-moss">
                    {item}
                  </li>
                ))}
              </ul>
              {day.notes.length ? (
                <ul className="flex flex-wrap gap-2">
                  {day.notes.map((note) => {
                    const Icon = noteIcon(note);
                    return (
                      <li key={note} className="flex items-center gap-2 rounded-full border border-ink/15 px-3 py-1.5 text-[0.85rem]">
                        <Icon className="text-[0.95rem] text-river" />
                        {note}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Hotels({ tiers }: { tiers: HotelTier[] }) {
  return (
    <div className={`grid gap-4 ${tiers.length >= 3 ? "lg:grid-cols-3" : tiers.length === 2 ? "sm:grid-cols-2" : ""}`}>
      {tiers.map((tier) => (
        <div key={tier.name} data-motion="rise" className="flex min-w-0 flex-col gap-4 rounded-tl-[1.75rem] rounded-br-[1.75rem] bg-cloud p-5">
          <p className="label text-mandarin">{tier.name}</p>
          <ul className="flex flex-col gap-3">
            {tier.stays.map((stay, i) => (
              <li key={i} className="flex min-w-0 flex-col gap-0.5">
                {stay.place ? <span className="font-display font-semibold">{stay.place}</span> : null}
                <span className="text-[0.95rem] leading-snug text-moss">{stay.names}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
