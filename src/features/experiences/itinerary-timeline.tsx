"use client";

/**
 * Package itinerary: a day switcher (when there is more than one day) and a
 * vertical trail of stops — time, a glyph per stop type, details and a photo.
 */
import * as Tabs from "@radix-ui/react-tabs";
import Image from "next/image";
import type { ItineraryDay, ItineraryStop } from "@/content/experiences/schema";
import { BedIcon, CarIcon, CupIcon, FlagIcon } from "@/ui/icons";

export function ItineraryTimeline({ days }: { days: ItineraryDay[] }) {
  if (days.length === 1 && days[0]) return <DayTrail day={days[0]} />;

  return (
    <Tabs.Root defaultValue="0" className="flex flex-col gap-6">
      <Tabs.List aria-label="Itinerary days" className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((day, i) => (
          <Tabs.Trigger
            key={i}
            value={String(i)}
            className="flex shrink-0 flex-col items-start gap-0.5 rounded-2xl border border-ink/15 px-4 py-2.5 text-left transition-colors hover:border-ink data-[state=active]:border-ink data-[state=active]:bg-ink data-[state=active]:text-fog"
          >
            <span className="label opacity-70">Day {String(i + 1).padStart(2, "0")}</span>
            <span className="max-w-[16rem] truncate text-[0.9rem] font-medium">{day.title}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {days.map((day, i) => (
        <Tabs.Content key={i} value={String(i)} className="focus-visible:outline-offset-8 motion-safe:data-[state=active]:animate-[fade-in_0.4s_var(--ease-out-expo)]">
          <DayTrail day={day} />
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

function DayTrail({ day }: { day: ItineraryDay }) {
  return (
    <div className="flex flex-col gap-5">
      <h4 className="font-display text-[1.25rem] font-semibold tracking-[-0.01em]">{day.title}</h4>
      <ol className="relative flex flex-col">
        {day.stops.map((stop, i) => (
          <Stop key={`${stop.title}-${i}`} stop={stop} last={i === day.stops.length - 1} />
        ))}
      </ol>
    </div>
  );
}

function Stop({ stop, last }: { stop: ItineraryStop; last: boolean }) {
  const muted = stop.kind === "transfer" || stop.kind === "meal" || stop.kind === "stay";
  return (
    <li className="grid grid-cols-[3.25rem_1.75rem_1fr] gap-x-3">
      <span className="pt-0.5 font-mono text-[0.78rem] text-moss tabular-nums">{stop.time ?? ""}</span>

      <span className="relative flex justify-center">
        {/* The trail line: dashed for travel time between stops. */}
        {!last ? <span aria-hidden="true" className="absolute top-6 bottom-0 left-1/2 w-px -translate-x-1/2 border-l border-dashed border-ink/25" /> : null}
        <Node kind={stop.kind} />
      </span>

      <div className={`flex min-w-0 flex-col gap-2 ${last ? "pb-0" : "pb-7"}`}>
        <p className={`text-[1rem] leading-snug ${muted ? "text-moss" : "font-semibold"}`}>{stop.title}</p>
        {stop.duration || stop.tags.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {stop.duration ? <li className="rounded-full bg-ink/6 px-2.5 py-0.5 font-mono text-[0.72rem] tabular-nums">{stop.duration}</li> : null}
            {stop.tags.map((t) => (
              <li key={t} className="rounded-full border border-ink/12 px-2.5 py-0.5 text-[0.75rem] text-moss">
                {t}
              </li>
            ))}
          </ul>
        ) : null}
        {stop.text ? <p className="max-w-[56ch] text-[0.92rem] leading-relaxed text-moss">{stop.text}</p> : null}
        {stop.image ? (
          <div className="relative mt-1 aspect-[16/9] w-full max-w-[22rem] overflow-hidden rounded-tl-[1.5rem] rounded-br-[1.5rem] bg-cloud">
            <Image src={stop.image.src} alt={stop.image.alt} fill sizes="(min-width: 768px) 352px, 70vw" className="object-cover" />
          </div>
        ) : null}
      </div>
    </li>
  );
}

function Node({ kind }: { kind: ItineraryStop["kind"] }) {
  const base = "relative z-10 grid size-6 place-items-center rounded-full text-[0.8rem]";
  switch (kind) {
    case "start":
      return <span aria-hidden="true" className={`${base} bg-mandarin ring-4 ring-mandarin/20`} />;
    case "end":
      return (
        <span aria-hidden="true" className={`${base} bg-ink text-fog`}>
          <FlagIcon />
        </span>
      );
    case "meal":
      return (
        <span aria-hidden="true" className={`${base} bg-fog text-moss ring-1 ring-ink/15`}>
          <CupIcon />
        </span>
      );
    case "transfer":
      return (
        <span aria-hidden="true" className={`${base} bg-fog text-moss ring-1 ring-ink/15`}>
          <CarIcon />
        </span>
      );
    case "stay":
      return (
        <span aria-hidden="true" className={`${base} bg-river text-jade`}>
          <BedIcon />
        </span>
      );
    default:
      return <span aria-hidden="true" className={`${base} border-2 border-ink bg-fog`} />;
  }
}
