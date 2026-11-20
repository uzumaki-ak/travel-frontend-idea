/**
 * Static content blocks of an experience page (server components):
 * key facts, overview + highlights, what's included, good to know, FAQ.
 */
import type { Experience } from "@/content/experiences/schema";
import {
  BedIcon,
  CalendarCheckIcon,
  CarIcon,
  CheckIcon,
  ClockIcon,
  CrossIcon,
  FlagIcon,
  PinIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
} from "@/ui/icons";
import { ReadMore } from "./read-more";

const FACT_ICON = {
  cancel: CalendarCheckIcon,
  "pay-later": WalletIcon,
  duration: ClockIcon,
  guide: FlagIcon,
  pickup: CarIcon,
  confirm: ShieldCheckIcon,
  group: UsersIcon,
  hotel: BedIcon,
} as const;

/** One horizontal, swipeable row of short facts right under the photos. */
export function KeyFacts({ facts }: { facts: Experience["facts"] }) {
  if (!facts.length) return null;
  return (
    <section aria-label="Key details" className="wrap pt-6 md:pt-8">
      <ul className="scrollbar-none -mx-(--gutter-x) flex snap-x gap-2.5 overflow-x-auto scroll-px-(--gutter-x) px-(--gutter-x) pb-1">
        {facts.map((f) => {
          const Icon = FACT_ICON[f.icon];
          return (
            <li key={f.title} className="flex shrink-0 snap-start items-center gap-2.5 rounded-full border border-ink/12 py-1.5 pr-4 pl-1.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-river text-jade">
                <Icon />
              </span>
              <span className="text-[0.92rem] font-medium whitespace-nowrap">{f.title}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Overview({ experience }: { experience: Experience }) {
  return (
    <section id="overview" aria-labelledby="overview-title" className="scroll-mt-32 md:scroll-mt-44 flex flex-col gap-8">
      <SectionTitle id="overview-title">
        About this experience
      </SectionTitle>
      <p data-motion="words" className="font-display text-[clamp(1.15rem,1.7vw,1.5rem)] leading-[1.35] font-medium tracking-[-0.015em]">
        {experience.summary}
      </p>
      {experience.highlights.length ? (
        <div className="flex flex-col gap-4">
          <h3 className="label text-moss">Highlights</h3>
          <ol className="flex flex-col">
            {experience.highlights.map((h, i) => (
              <li key={h} data-motion="rise" className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-ink/10 py-4 last:border-b">
                <span className="pt-0.5 font-mono text-[0.8rem] text-mandarin tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[1.05rem] leading-snug">{h}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {experience.description.length ? (
        <ReadMore lines={6} className="flex max-w-[68ch] flex-col gap-4 text-[1.02rem] leading-relaxed text-ink/85">
          {experience.description.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </ReadMore>
      ) : null}
    </section>
  );
}

export function Inclusions({ includes, excludes }: { includes: string[]; excludes: string[] }) {
  if (!includes.length && !excludes.length) return null;
  return (
    <section id="included" aria-labelledby="includes-title" className="scroll-mt-32 md:scroll-mt-44 flex flex-col gap-8">
      <SectionTitle id="includes-title">
        What’s included
      </SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <List items={includes} positive />
        <List items={excludes} />
      </div>
    </section>
  );
}

function List({ items, positive = false }: { items: string[]; positive?: boolean }) {
  if (!items.length) return null;
  return (
    <div className={`flex flex-col gap-4 rounded-tl-[2rem] rounded-br-[2rem] p-6 ${positive ? "bg-river text-cloud" : "bg-cloud"}`}>
      <h3 className={`label ${positive ? "text-jade" : "text-moss"}`}>{positive ? "Included" : "Not included"}</h3>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[0.75rem] ${positive ? "bg-jade text-river-deep" : "bg-ink/10 text-moss"}`}>
              {positive ? <CheckIcon /> : <CrossIcon />}
            </span>
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GoodToKnow({ experience }: { experience: Experience }) {
  const { importantInfo, notSuitableFor, meetingPoint } = experience;
  if (!importantInfo.length && !notSuitableFor.length && !meetingPoint) return null;
  return (
    <section id="know" aria-labelledby="know-title" className="scroll-mt-32 md:scroll-mt-44 flex flex-col gap-8">
      <SectionTitle id="know-title">
        Good to know
      </SectionTitle>
      <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
        {meetingPoint ? (
          <div className="flex flex-col gap-3 md:col-span-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <PinIcon className="text-mandarin" />
              {meetingPoint.title}
            </h3>
            <p className="max-w-[68ch] leading-relaxed text-ink/85">{meetingPoint.text}</p>
          </div>
        ) : null}
        {importantInfo.map((block) => (
          <div key={block.title} className="flex flex-col gap-3">
            <h3 className="font-semibold">{block.title}</h3>
            <ul className="flex flex-col gap-2">
              {block.items.map((item) => (
                <li key={item} className="flex gap-3 leading-snug text-ink/85 before:mt-2 before:size-1.5 before:shrink-0 before:rounded-full before:bg-mandarin">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {notSuitableFor.length ? (
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold">Not suitable for</h3>
            <ul className="flex flex-wrap gap-2">
              {notSuitableFor.map((item) => (
                <li key={item} className="rounded-full border border-ink/15 px-3 py-1.5 text-[0.9rem]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function ExperienceFaq({ faqs }: { faqs: Experience["faqs"] }) {
  if (!faqs.length) return null;
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-32 md:scroll-mt-44 flex flex-col gap-8">
      <SectionTitle id="faq-title">
        Frequently asked
      </SectionTitle>
      <div className="flex flex-col">
        {faqs.map((f) => (
          <details key={f.question} className="group border-t border-ink/12 last:border-b">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-[1.1rem] font-medium [&::-webkit-details-marker]:hidden">
              {f.question}
              <span aria-hidden="true" className="relative grid size-9 shrink-0 place-items-center rounded-full border border-ink/20 transition-colors group-open:bg-ink group-open:text-fog">
                <span className="absolute h-px w-3.5 bg-current" />
                <span className="absolute h-3.5 w-px bg-current transition-transform duration-500 ease-out-expo group-open:rotate-90" />
              </span>
            </summary>
            <p className="max-w-[68ch] pb-6 leading-relaxed text-ink/85">{f.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} data-motion="lines" className="font-display text-title font-bold tracking-[-0.03em]">
      {children}
    </h2>
  );
}
