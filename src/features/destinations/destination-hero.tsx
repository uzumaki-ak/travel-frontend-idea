/**
 * Hub opener: a near full-screen stage (film or photo sequence) with the
 * destination's name set huge over it, the tagline and the two ways in.
 * Below it, the hub's numbers in one row and the intro with "Read more".
 * Entrance is load-time only (CSS); nothing animates on scroll.
 */
import Link from "next/link";
import type { Destination } from "@/content/destinations/schema";
import { resolveSitePath } from "@/content/routes";
import { formatInr } from "@/features/experiences/format";
import { ReadMore } from "@/features/experiences/read-more";
import { SmoothAnchor } from "@/features/experiences/smooth-anchor";
import { ArrowRightIcon, StarIcon } from "@/ui/icons";
import { HeroStage } from "./hero-stage";

export type HubStats = {
  tours: number;
  rating: number;
  reviews: number;
  minDays: number;
  maxDays: number;
  fromPrice: number;
  fromUnit: "per person" | "per group";
};

/** A breadcrumb step; without `href` it is plain text (no page there yet). */
export type Crumb = { label: string; href?: string };

export function DestinationHero({
  destination,
  crumbs,
  stats,
  toursHref,
  current,
  tabs,
}: {
  destination: Destination;
  crumbs: Crumb[];
  stats: HubStats;
  /** "#tours" scrolls to the list on this page; a path opens another page. */
  toursHref: string;
  /** Last breadcrumb (defaults to the destination's name). */
  current?: string;
  /** The destination's tabs (glass bar), shown at the foot of the stage. */
  tabs?: React.ReactNode;
}) {
  const { name, hero } = destination;
  const days = stats.minDays === stats.maxDays ? `${stats.maxDays} days` : `${stats.minDays}–${stats.maxDays} days`;

  return (
    <section aria-labelledby="destination-title" className="pt-[calc(var(--header-h)+1rem)] md:pt-[calc(var(--header-h)+2.5rem)]">
      <nav aria-label="Breadcrumb" className="wrap pb-4 md:pb-5">
        <ol className="flex flex-wrap items-center gap-2 text-[0.85rem] text-moss">
          {crumbs.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              {c.href ? (
                <a href={resolveSitePath(c.href)} className="transition-colors hover:text-ink">
                  {c.label}
                </a>
              ) : (
                <span>{c.label}</span>
              )}
              <span aria-hidden="true">/</span>
            </li>
          ))}
          <li aria-current="page" className="text-ink">
            {current ?? name}
          </li>
        </ol>
      </nav>
      <div className="mx-auto max-w-[1840px] px-2 md:px-4">
        <HeroStage slides={hero.images} video={hero.video}>
          <div className="flex flex-col gap-6 md:gap-8">
            <h1
              id="destination-title"
              className="-ml-[0.04em] font-display text-[clamp(3.75rem,15.5vw,15rem)] leading-[0.82] font-bold tracking-[-0.05em] [font-variation-settings:'opsz'_96]"
            >
              <span className="hero-line">
                <span>{name}</span>
              </span>
            </h1>

            <p className="hero-fade max-w-[34ch] font-display text-[clamp(1.1rem,1.7vw,1.5rem)] leading-[1.3] font-medium text-fog/90 [--delay:520ms]">
              {hero.tagline}
            </p>

            <div className="hero-fade flex flex-wrap items-center gap-3 [--delay:680ms]">
              {toursHref.startsWith("#") ? (
                <SmoothAnchor href={toursHref as `#${string}`} className="group inline-flex items-center gap-3 rounded-full bg-mandarin py-2 pr-2 pl-6 font-display font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5">
                Browse all tours
                <span className="grid size-10 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                  <ArrowRightIcon />
                </span>
              </SmoothAnchor>
              ) : (
                <Link href={toursHref} className="group inline-flex items-center gap-3 rounded-full bg-mandarin py-2 pr-2 pl-6 font-display font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5">
                Browse all tours
                <span className="grid size-10 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                  <ArrowRightIcon />
                </span>
              </Link>
              )}
              <a
                href="#enquiry"
                className="inline-flex items-center rounded-full border border-fog/40 px-6 py-[0.95rem] font-display font-semibold text-fog backdrop-blur-sm transition-colors hover:bg-fog hover:text-ink"
              >
                Talk to a local expert
              </a>
            </div>
            {tabs ? <div className="hero-fade w-full pt-2 [--delay:820ms]">{tabs}</div> : null}
          </div>
        </HeroStage>
      </div>

      <div className="wrap grid gap-12 pt-14 md:pt-20 lg:grid-cols-12 lg:gap-10">
        {/* The hub in numbers. */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 self-start lg:col-span-5">
          <Stat value={String(stats.tours)} label="tours to choose from" />
          <Stat
            value={
              <span className="inline-flex items-center gap-2">
                {stats.rating.toFixed(1)}
                <StarIcon className="text-[0.55em] text-mandarin" />
              </span>
            }
            label={`from ${stats.reviews.toLocaleString("en-IN")} reviews`}
          />
          <Stat value={days} label="from a few hours to a full loop" />
          <Stat value={formatInr(stats.fromPrice)} label={`lowest price, ${stats.fromUnit}`} />
        </dl>

        <div className="lg:col-span-7">
          <ReadMore lines={5} className="flex max-w-[68ch] flex-col gap-4 text-[1.05rem] leading-relaxed text-ink/85">
            {hero.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </ReadMore>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-ink/15 pt-4">
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-[clamp(2rem,3.4vw,3rem)] leading-none font-bold tracking-[-0.035em] tabular-nums">{value}</dd>
      <dd aria-hidden="true" className="text-[0.9rem] text-moss">
        {label}
      </dd>
    </div>
  );
}
