import { resolveSitePath } from "@/content/routes";
import { isServedPath } from "@/content/served-paths";
import type { FromPrice } from "@/content/experiences";
import type { Experience } from "@/content/experiences/schema";
import { ArrowRightIcon, ClockIcon, PinIcon } from "@/ui/icons";
import { formatInr, plural, savingPercent } from "./format";
import { RatingStars } from "./rating-stars";
import { SmoothAnchor } from "./smooth-anchor";

type Crumb = { label: string; href: string };

/**
 * Opener: breadcrumb, title and a "trail ticket" — a perforated stub with the
 * lowest price and the jump to the package picker. The ticket is hidden on phones.
 */
export function ExperienceHero({ experience, crumbs, from }: { experience: Experience; crumbs: Crumb[]; from: FromPrice }) {
  const { location, rating, duration, badge, categories } = experience;
  // Location hubs are not built yet; only link them once they exist.
  const locationHref = location.href && isServedPath(location.href) ? location.href : null;

  return (
    <section aria-labelledby="experience-title" className="pt-[calc(var(--header-h)+2rem)] md:pt-[calc(var(--header-h)+3.5rem)]">
      <div className="wrap grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <nav aria-label="Breadcrumb" className="hero-fade [--delay:80ms]">
            <ol className="flex flex-wrap items-center gap-2 label text-moss">
              {crumbs.map((c) => (
                <li key={c.href} className="flex items-center gap-2">
                  <a href={resolveSitePath(c.href)} className="hover:text-ink">
                    {c.label}
                  </a>
                  <span aria-hidden="true">/</span>
                </li>
              ))}
              <li aria-current="page" className="max-w-[28ch] truncate text-ink">
                {experience.title}
              </li>
            </ol>
          </nav>

          {badge || categories.length ? (
            <ul className="hero-fade flex flex-wrap gap-2 [--delay:180ms]">
              {badge ? <li className="rounded-full bg-mandarin px-3 py-1 label text-ink">{badge}</li> : null}
              {categories.map((c) => (
                <li key={c} className="rounded-full border border-ink/15 px-3 py-1 label text-moss">
                  {c}
                </li>
              ))}
            </ul>
          ) : null}

          <h1
            id="experience-title"
            className="hero-line font-display text-[clamp(2.1rem,4.8vw,4.75rem)] leading-[0.98] font-bold tracking-[-0.035em] [font-variation-settings:'opsz'_96]"
          >
            <span>{experience.title}</span>
          </h1>

          <ul className="hero-fade flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.95rem] [--delay:420ms]">
            {rating.count ? (
              <li className="flex items-center gap-2">
                <RatingStars value={rating.average} className="text-[1rem]" />
                <a href="#reviews" className="underline-offset-4 hover:underline">
                  <span className="font-semibold tabular-nums">{rating.average.toFixed(1)}</span>
                  <span className="text-moss"> · {plural(rating.count, "review", "reviews")}</span>
                </a>
              </li>
            ) : null}
            <li className="flex items-center gap-2">
              <PinIcon className="text-moss" />
              {locationHref ? (
                <a href={locationHref} className="underline-offset-4 hover:underline">
                  {location.name}, {location.region}
                </a>
              ) : (
                <span>
                  {location.name}, {location.region}
                </span>
              )}
            </li>
            <li className="flex items-center gap-2">
              <ClockIcon className="text-moss" />
              <span>{duration.label}</span>
            </li>
          </ul>
        </div>

        {/* Hidden on phones. On desktop a pinned copy (StickyTicket) takes over below the photos. */}
        <div id="hero-ticket" className="hero-fade hidden md:block lg:col-span-4 [--delay:520ms]">
          <PriceTicket from={from} packageCount={experience.packages.length} />
        </div>
      </div>
    </section>
  );
}

/** The ticket stub. Notches are circles in the page (fog) colour. */
export function PriceTicket({ from, packageCount }: { from: FromPrice; packageCount: number }) {
  const saving = savingPercent(from.price, from.compareAt);
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[1.75rem] bg-ink text-fog">
      <div className="flex items-start justify-between gap-4 p-6 pb-5">
        <div className="flex flex-col gap-1">
          <span className="label text-jade">From</span>
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-none font-bold tracking-[-0.03em] tabular-nums">
              {formatInr(from.price)}
            </span>
            {from.compareAt && saving ? <s className="font-mono text-[0.85rem] text-fog/50 tabular-nums">{formatInr(from.compareAt)}</s> : null}
          </span>
          <span className="text-[0.85rem] text-fog/60">{from.unit}</span>
        </div>
        {saving ? <span className="shrink-0 rounded-full bg-jade px-3 py-1 label text-river-deep">−{saving}%</span> : null}
      </div>

      <div aria-hidden="true" className="relative mx-6 border-t border-dashed border-white/20">
        <span className="absolute -top-3 -left-9 size-6 rounded-full bg-fog" />
        <span className="absolute -top-3 -right-9 size-6 rounded-full bg-fog" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-6 pt-5">
        <span className="font-mono text-[0.75rem] leading-relaxed whitespace-nowrap text-fog/60">
          {plural(packageCount, "package", "packages")}
          <br />
          Reserve now, pay later
        </span>
        <SmoothAnchor
          href="#packages"
          className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-mandarin py-2 pr-2 pl-5 font-display font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
        >
          Choose package
          <span className="grid size-9 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
            <ArrowRightIcon />
          </span>
        </SmoothAnchor>
      </div>
    </div>
  );
}
