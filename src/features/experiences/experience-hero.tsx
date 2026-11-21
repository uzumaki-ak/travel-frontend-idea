import { resolveSitePath } from "@/content/routes";
import { isServedPath } from "@/content/served-paths";
import type { Experience } from "@/content/experiences/schema";
import { ClockIcon, PinIcon } from "@/ui/icons";
import { plural } from "./format";
import { RatingStars } from "./rating-stars";

type Crumb = { label: string; href: string };

/**
 * Opener: breadcrumb, badges, title, rating, place and duration. The price
 * ticket lives beside the content below (StickyTicket), not here.
 */
export function ExperienceHero({ experience, crumbs }: { experience: Experience; crumbs: Crumb[] }) {
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
      </div>
    </section>
  );
}
