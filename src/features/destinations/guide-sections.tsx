/**
 * Sections of the destination page (the guide). Each one has its own layout so
 * the page reads like a travel magazine, not a row of carousels:
 *
 *  - GuideHero: title and quick facts side by side, then a cinematic film band.
 *  - MustVisit: one large statement with photos floating around it.
 *  - PlacesToVisit: a staggered portrait grid (alternate columns sit lower).
 *  - ThingsToDo: a numbered editorial list, photo beside text.
 *  - GoodToKnow: big figures, outlined labels, hairline columns.
 *
 * Server components. Load-time entrance only; nothing animates on scroll.
 */
import Image from "next/image";
import Link from "next/link";
import type { Destination, DestinationListing } from "@/content/destinations/schema";
import { resolveSitePath } from "@/content/routes";
import { experiencePath } from "@/content/experiences/slugs";
import { formatInr } from "@/features/experiences/format";
import { ReadMore } from "@/features/experiences/read-more";
import { ArrowRightIcon, StarIcon } from "@/ui/icons";
import type { Crumb } from "./destination-hero";
import { DestinationTabs, tabCounts } from "./destination-tabs";
import { StickyTabs } from "./sticky-tabs";
import { HeroStage } from "./hero-stage";
import { SectionHead } from "./hub-sections";
import { ThemedList, type ThemedItem } from "./themed-list";

/* ----------------------------------------------------------------------- Hero */

/**
 * A big photo card (film or slideshow) with the name set large in its centre and
 * the destination's five ways in as a frosted bar along its foot. Under the
 * card, the quick facts as one hairline strip.
 */
export function GuideHero({ destination, crumbs }: { destination: Destination; crumbs: Crumb[] }) {
  const { name, hero, quickFacts } = destination;
  return (
    <section aria-labelledby="destination-title" className="pt-[calc(var(--header-h)+1rem)] md:pt-[calc(var(--header-h)+2rem)]">
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
            {name}
          </li>
        </ol>
      </nav>

      <div className="mx-auto max-w-[1840px] px-2 md:px-4">
        <HeroStage
          slides={hero.images}
          video={hero.video}
          contentClassName="absolute inset-0 flex flex-col items-center justify-end gap-8 px-3 pt-28 pb-3 text-center md:gap-12 md:px-8 md:pb-8"
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-5 md:gap-7">
            <h1
              id="destination-title"
              className="font-display text-[clamp(3.6rem,14vw,13rem)] leading-[0.82] font-bold tracking-[-0.05em] [font-variation-settings:'opsz'_96]"
            >
              <span className="hero-line">
                <span>{name}</span>
              </span>
            </h1>
            <p className="hero-fade max-w-[34ch] font-display text-[clamp(1.05rem,1.6vw,1.4rem)] leading-[1.3] font-medium text-fog/90 [--delay:520ms]">{hero.tagline}</p>
          </div>
          <div className="hero-fade w-full [--delay:700ms]">
            <StickyTabs floating={<DestinationTabs slug={destination.slug} current="overview" counts={tabCounts(destination)} variant="float" />}>
              <DestinationTabs slug={destination.slug} current="overview" counts={tabCounts(destination)} variant="glass" />
            </StickyTabs>
          </div>
        </HeroStage>
      </div>

      {quickFacts.length ? (
        <dl className="wrap grid grid-cols-2 gap-x-6 pt-8 sm:grid-cols-3 md:pt-10 lg:grid-cols-5">
          {quickFacts.map((f) => (
            <div key={f.label} className="flex flex-col gap-1 border-t border-ink/15 py-4">
              <dt className="text-[0.8rem] text-moss">{f.label}</dt>
              <dd className="font-display text-[1.05rem] leading-snug font-semibold tracking-[-0.01em]">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ Must-visit */

/** "[words]" in the statement are set in an outlined pill. */
function Statement({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]]+\])/).map((part, i) =>
        part.startsWith("[") ? (
          <span key={i} className="rounded-full border-[1.5px] border-river px-[0.3em] text-river [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

// Where the floating photos sit around the statement (desktop).
const FLOAT = [
  "top-0 left-0 w-[13%] aspect-[3/4] rounded-xl",
  "top-10 right-[2%] w-[17%] aspect-[4/3] rounded-xl",
  "bottom-6 left-[5%] w-[16%] aspect-[4/3] rounded-xl",
  "right-0 bottom-0 w-[12%] aspect-[3/4] rounded-xl",
];

export function MustVisit({ destination }: { destination: Destination }) {
  const { name, hero, statement } = destination;
  const photos = hero.images.slice(1, 5);
  return (
    <section aria-labelledby="must-title" className="wrap flex flex-col gap-10 pt-24 md:pt-32">
      <h2 id="must-title" className="font-display text-title font-bold tracking-[-0.03em]">
        What makes {name} a must-visit destination?
      </h2>
      <div className="relative flex flex-col items-center gap-10 lg:min-h-[34rem] lg:justify-center lg:py-10">
        {photos.map((p, i) => (
          <div key={p.src} aria-hidden="true" className={`absolute hidden overflow-hidden bg-cloud lg:block ${FLOAT[i]}`}>
            <Image src={p.src} alt="" fill sizes="16vw" className="object-cover" />
          </div>
        ))}
        {statement ? (
          <p className="relative max-w-[24ch] text-center font-display text-[clamp(1.7rem,3.6vw,3.1rem)] leading-[1.18] font-semibold tracking-[-0.025em] text-ink">
            <Statement text={statement} />
          </p>
        ) : null}
        {/* Phones: the photos as a small strip under the statement. */}
        <div aria-hidden="true" className="scrollbar-none -mx-(--gutter-x) flex w-[calc(100%+2*var(--gutter-x))] gap-3 overflow-x-auto px-(--gutter-x) lg:hidden">
          {photos.map((p) => (
            <div key={p.src} className={`relative aspect-[3/4] w-[38%] shrink-0 overflow-hidden bg-cloud sm:w-[22%] rounded-xl`}>
              <Image src={p.src} alt="" fill sizes="(min-width: 640px) 22vw, 38vw" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="relative w-full max-w-[62ch]">
          <ReadMore lines={4} className="flex flex-col gap-4 text-[1.05rem] leading-relaxed text-ink/85">
            {hero.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </ReadMore>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Places to visit */

/** Staggered portrait row: small tall cards, every other one sits lower. Theme chips on top. */
export function PlacesToVisit({
  name,
  attractions,
  themes,
  action,
  title,
  grid = false,
}: {
  name: string;
  attractions: Destination["attractions"];
  themes: Destination["attractionThemes"];
  action?: React.ReactNode;
  title?: string;
  /** The attractions page: every place in a staggered grid instead of a row. */
  grid?: boolean;
}) {
  if (!attractions.length) return null;
  const items: ThemedItem[] = attractions.map((a) => ({
    key: a.name,
    themes: a.themes,
    node: (
      <>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-cloud">
          <Image src={a.image.src} alt={a.image.alt} fill sizes="(min-width: 640px) 216px, 44vw" className="object-cover transition-[scale] duration-[1.2s] ease-out-expo group-hover:scale-[1.04]" />
          <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-fog/90 px-3 py-1 text-[0.78rem] font-medium backdrop-blur md:bottom-4 md:left-4">
            {a.place}
          </span>
        </div>
        <span className="font-display text-[0.98rem] leading-snug font-semibold tracking-[-0.01em]">{a.name}</span>
        <span className="line-clamp-2 text-[0.85rem] leading-relaxed text-moss">{a.text}</span>
      </>
    ),
  }));
  return (
    <section id="attractions" aria-labelledby="places-title" className="flex scroll-mt-28 flex-col gap-8 pt-24 md:scroll-mt-36 md:pt-32">
      <SectionHead id="places-title" title={title ?? `Places to visit in ${name}`} action={action} />
      <ThemedList
        label={`Places to visit in ${name}`}
        themes={themes}
        items={items}
        rail={!grid}
        outerClassName="wrap"
        listClassName="grid grid-cols-2 gap-x-4 gap-y-8 pb-10 sm:grid-cols-3 md:gap-x-5 lg:grid-cols-5"
        itemClassName={
          grid
            ? "group flex flex-col gap-2 [&:nth-child(even)]:translate-y-10"
            : "group flex w-[44vw] max-w-[13.5rem] shrink-0 snap-start flex-col gap-2 sm:w-[13.5rem] [&:nth-child(even)]:pt-10"
        }
      />
    </section>
  );
}

/* ----------------------------------------------------------------- Things to do */

/** Numbered list, two columns on desktop: number, photo, then the details. Each row opens the experience. */
export function ThingsToDo({
  name,
  experiences,
  themes,
  action,
  title,
}: {
  name: string;
  experiences: DestinationListing[];
  themes: Destination["experienceThemes"];
  action?: React.ReactNode;
  title?: string;
}) {
  if (!experiences.length) return null;
  const items: ThemedItem[] = experiences.map((l, i) => ({
    key: l.id,
    themes: l.experienceThemes,
    node: (
      <article className="group relative flex items-center gap-4 py-5 md:gap-6">
        <span aria-hidden="true" className="w-9 shrink-0 font-display text-[1.9rem] leading-none font-bold tracking-[-0.04em] text-ink/20 tabular-nums transition-colors group-hover:text-mandarin md:w-12 md:text-[2.6rem]">
          {String(i + 1).padStart(2, "0")}
        </span>
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-cloud md:w-32">
          <Image src={l.images[0]!.src} alt={l.images[0]!.alt} fill sizes="128px" className="object-cover transition-[scale] duration-700 ease-out-expo group-hover:scale-[1.06]" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 className="font-display text-[1rem] leading-snug font-semibold tracking-[-0.01em] md:text-[1.1rem]">
            <Link href={experiencePath(l.experience)} className="after:absolute after:inset-0 focus-visible:outline-none group-has-focus-visible:underline">
              {l.title}
            </Link>
          </h3>
          <p className="line-clamp-2 hidden text-[0.9rem] leading-relaxed text-moss sm:block">{l.summary}</p>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.84rem] text-moss">
            <span>{l.durationLabel}</span>
            {l.rating.count ? (
              <span className="inline-flex items-center gap-1">
                <StarIcon className="text-mandarin" />
                <span className="font-medium text-ink tabular-nums">{l.rating.average.toFixed(1)}</span>
              </span>
            ) : null}
            <span className="font-mono font-semibold text-ink tabular-nums">{formatInr(l.price.from)}</span>
          </span>
        </div>
        <ArrowRightIcon className="hidden shrink-0 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 md:block" />
      </article>
    ),
  }));
  return (
    <section id="things-to-do" aria-labelledby="todo-title" className="flex scroll-mt-28 flex-col gap-8 pt-24 md:scroll-mt-36 md:pt-32">
      <SectionHead id="todo-title" title={title ?? `Things to do in ${name}`} action={action} />
      <ThemedList
        label={`Things to do in ${name}`}
        themes={themes}
        items={items}
        outerClassName="wrap"
        listClassName="grid border-b border-ink/12 lg:grid-cols-2 lg:gap-x-12"
        itemClassName="border-t border-ink/12"
      />
    </section>
  );
}

/* ----------------------------------------------------------------- Good to know */

/** Tips and facts: big figures, an outlined label, a short line. Hairline columns; a swipe row on phones. */
export function GoodToKnow({ name, facts }: { name: string; facts: Destination["facts"] }) {
  if (!facts.length) return null;
  return (
    <section aria-labelledby="facts-title" className="mt-24 rounded-t-[2.5rem] bg-cloud pt-20 pb-20 md:mt-32 md:rounded-t-[4rem] md:pt-28 md:pb-28">
      <div className="flex flex-col gap-12">
        <SectionHead id="facts-title" title={`Tips and interesting facts about ${name}`} />
        <div className="md:wrap">
          <ul className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter-x) px-(--gutter-x) pb-1 md:grid md:grid-cols-2 md:gap-0 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
            {facts.map((f) => (
              <li
                key={f.label}
                className="flex w-[78%] shrink-0 snap-start flex-col gap-4 rounded-xl bg-fog p-6 md:w-auto md:rounded-none md:border-t md:border-ink/12 md:bg-transparent md:px-8 md:py-10 md:[&:nth-child(3n+1)]:pl-0 lg:border-l lg:[&:nth-child(3n+1)]:border-l-0"
              >
                <span className={`font-display text-[clamp(2.2rem,4.2vw,3.6rem)] leading-[0.95] font-bold tracking-[-0.04em] text-river`}>{f.value}</span>
                <span className="self-start rounded-full border border-ink/25 px-3 py-1 text-[0.8rem] font-medium">{f.label}</span>
                <span className="leading-relaxed text-moss">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
