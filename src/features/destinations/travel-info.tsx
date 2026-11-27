"use client";

/**
 * "Important information" tabs: best time to visit, how to reach, weather.
 * All panels are in the HTML (force-mounted, hidden when inactive) so the copy
 * is crawlable, like the SEO link tabs.
 */
import * as Tabs from "@radix-ui/react-tabs";
import type { Destination } from "@/content/destinations/schema";
import { CarIcon, DepartIcon, FlagIcon } from "@/ui/icons";

type Info = NonNullable<Destination["info"]>;
type Verdict = Info["bestTime"]["seasons"][number]["verdict"];

const VERDICT: Record<Verdict, { label: string; className: string }> = {
  best: { label: "Best", className: "bg-jade text-river-deep" },
  good: { label: "Good", className: "bg-ink/10 text-ink" },
  wet: { label: "Rainy", className: "bg-mandarin text-ink" },
};

const MODE_ICON = { air: DepartIcon, rail: FlagIcon, road: CarIcon } as const;

/** Month verdict from rainfall: the same split the seasons above use. */
const monthVerdict = (rain: number): Verdict => (rain >= 350 ? "wet" : rain >= 200 ? "good" : "best");

export function TravelInfo({ name, info }: { name: string; info: Info }) {
  const tabs = [
    { id: "best-time", label: "Best time to visit" },
    { id: "reach", label: "How to reach" },
    { id: "weather", label: "Weather" },
  ];
  return (
    <Tabs.Root defaultValue="best-time" className="flex flex-col gap-10">
      <Tabs.List aria-label={`About ${name}`} className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.id}
            value={t.id}
            className="shrink-0 cursor-pointer rounded-full border border-ink/15 px-5 py-2.5 font-display text-[0.95rem] font-medium transition-colors hover:border-ink data-[state=active]:border-ink data-[state=active]:bg-ink data-[state=active]:text-fog"
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="best-time" forceMount className="flex flex-col gap-10 data-[state=inactive]:hidden">
        <p className="max-w-[60ch] font-display text-[clamp(1.15rem,1.6vw,1.4rem)] leading-[1.35] font-medium tracking-[-0.01em]">{info.bestTime.summary}</p>

        {/* The year at a glance. */}
        <ol aria-label="Month by month" className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
          {info.weather.months.map((m) => {
            const v = VERDICT[monthVerdict(m.rain)];
            return (
              <li key={m.month} className={`flex flex-col items-center gap-1 rounded-xl py-3 ${v.className}`}>
                <span className="font-mono text-[0.72rem] font-semibold">{m.month}</span>
                <span className="text-[0.68rem] opacity-75">{v.label}</span>
              </li>
            );
          })}
        </ol>

        <ul className="scrollbar-none relative -mx-(--gutter-x) flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter-x) px-(--gutter-x) pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
          {info.bestTime.seasons.map((s) => (
            <li key={s.name} className="flex w-[80%] shrink-0 snap-start flex-col gap-3 rounded-xl bg-fog p-6 md:w-auto">
              <span className="flex items-center justify-between gap-3">
                <span className="font-mono text-[0.8rem] text-moss">{s.months}</span>
                <span className={`rounded-full px-2.5 py-0.5 label ${VERDICT[s.verdict].className}`}>{VERDICT[s.verdict].label}</span>
              </span>
              <span className="font-display text-[1.25rem] font-semibold tracking-[-0.01em]">{s.name}</span>
              <span className="text-[0.95rem] leading-relaxed text-ink/80">{s.text}</span>
            </li>
          ))}
        </ul>
      </Tabs.Content>

      <Tabs.Content value="reach" forceMount className="data-[state=inactive]:hidden">
        <ol className="scrollbar-none relative -mx-(--gutter-x) flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter-x) px-(--gutter-x) pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
          {info.reach.map((r, i) => {
            const Icon = MODE_ICON[r.mode];
            return (
              <li key={r.mode} className="flex w-[80%] shrink-0 snap-start flex-col gap-4 rounded-xl bg-fog p-6 md:w-auto">
                <span className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-full bg-river text-xl text-jade">
                    <Icon />
                  </span>
                  <span className="font-mono text-[0.8rem] text-moss tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                </span>
                <span className="font-display text-[1.25rem] font-semibold tracking-[-0.01em]">{r.title}</span>
                <span className="text-[0.95rem] leading-relaxed text-ink/80">{r.text}</span>
              </li>
            );
          })}
        </ol>
      </Tabs.Content>

      <Tabs.Content value="weather" forceMount className="flex flex-col gap-6 data-[state=inactive]:hidden">
        <RainChart months={info.weather.months} />
        <p className="text-[0.85rem] text-moss">{info.weather.note}</p>
      </Tabs.Content>
    </Tabs.Root>
  );
}

/**
 * Monthly rainfall as one series of bars, with the temperature range as a row of
 * numbers below (not a second axis). Each bar has a hover tooltip; a hidden table
 * carries the same numbers for screen readers and keyboard users' assistive tech.
 */
function RainChart({ months }: { months: Info["weather"]["months"] }) {
  const max = Math.max(...months.map((m) => m.rain));
  const top = Math.ceil(max / 100) * 100;
  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="font-display text-[1.1rem] font-semibold">Rainfall by month</span>
        <span className="font-mono text-[0.75rem] text-moss">mm</span>
      </figcaption>

      <div aria-hidden="true" className="relative h-48 sm:h-56">
        {/* Recessive guides at 0, half and the top of the scale, each placed at its value. */}
        {[0, top / 2, top].map((v) => (
          <div key={v} className="pointer-events-none absolute inset-x-0 flex translate-y-1/2 items-center gap-2" style={{ bottom: `${(v / top) * 100}%` }}>
            <span className="w-8 font-mono text-[0.65rem] text-moss tabular-nums">{v}</span>
            <span className="h-px flex-1 bg-ink/10" />
          </div>
        ))}
        <div className="absolute inset-y-0 right-0 left-10 grid grid-cols-12 items-end gap-[2px]">
          {months.map((m) => (
            <div key={m.month} className="group relative flex h-full items-end justify-center">
              <div
                className="w-full max-w-7 rounded-t-[4px] bg-river transition-colors group-hover:bg-river-deep"
                style={{ height: `${Math.max(2, (m.rain / top) * 100)}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-[0.75rem] whitespace-nowrap text-fog group-hover:block">
                <span className="font-semibold">{m.month}</span> · {m.rain} mm · {m.low}–{m.high}°C
              </div>
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="ml-10 grid grid-cols-12 gap-[2px]">
        {months.map((m) => (
          <div key={m.month} className="flex flex-col items-center gap-0.5">
            <span className="font-mono text-[0.68rem] font-semibold">{m.month.slice(0, 1)}<span className="hidden sm:inline">{m.month.slice(1)}</span></span>
            <span className="font-mono text-[0.62rem] text-moss tabular-nums">
              {m.low}–{m.high}°
            </span>
          </div>
        ))}
      </div>

      <table className="sr-only">
        <caption>Average rainfall and temperature by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Rain (mm)</th>
            <th scope="col">Low (°C)</th>
            <th scope="col">High (°C)</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <th scope="row">{m.month}</th>
              <td>{m.rain}</td>
              <td>{m.low}</td>
              <td>{m.high}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
