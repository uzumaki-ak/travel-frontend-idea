"use client";

/**
 * Reviews: overall score, per-aspect bars, star distribution, and the list,
 * filterable by package, newest first, four at a time.
 */
import { useMemo, useState } from "react";
import type { Experience } from "@/content/experiences/schema";
import { formatMonthYear, plural } from "./format";
import { RatingStars } from "./rating-stars";

const PAGE = 4;

export function ExperienceReviews({ rating, reviews }: { rating: Experience["rating"]; reviews: Experience["reviews"] }) {
  const [filter, setFilter] = useState<string>("all");
  const [shown, setShown] = useState(PAGE);

  const packages = useMemo(() => [...new Set(reviews.map((r) => r.packageName).filter((p): p is string => Boolean(p)))], [reviews]);
  const sorted = useMemo(
    () => [...reviews].filter((r) => filter === "all" || r.packageName === filter).sort((a, b) => b.date.localeCompare(a.date)),
    [reviews, filter],
  );
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length }));

  if (!reviews.length && !rating.count) return null;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-32 md:scroll-mt-44 flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <span className="label text-moss">Traveller reviews</span>
        <h2 id="reviews-title" data-motion="lines" className="font-display text-title font-bold tracking-[-0.03em]">
          What travellers say
        </h2>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-4">
          <div className="flex items-end gap-4">
            <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] leading-[0.85] font-bold tracking-[-0.04em] tabular-nums">{rating.average.toFixed(1)}</span>
            <span className="flex flex-col gap-1.5 pb-1">
              <RatingStars value={rating.average} className="text-[1.1rem]" />
              <span className="text-[0.9rem] text-moss">{plural(rating.count, "review", "reviews")}</span>
            </span>
          </div>

          {rating.breakdown.length ? (
            <dl className="flex flex-col gap-3">
              {rating.breakdown.map((b) => (
                <div key={b.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[0.9rem]">
                    <dt>{b.label}</dt>
                    <dd className="font-mono tabular-nums">{b.score.toFixed(1)}</dd>
                  </div>
                  <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-river" style={{ width: `${(b.score / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </dl>
          ) : null}

          {reviews.length > 2 ? (
            <ul aria-label="Reviews by star rating" className="flex flex-col gap-1.5">
              {distribution.map((d) => (
                <li key={d.stars} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-3 font-mono text-[0.75rem] text-moss tabular-nums">
                  <span>{d.stars} ★</span>
                  <span aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-ink/10">
                    <span className="block h-full rounded-full bg-mandarin" style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }} />
                  </span>
                  <span className="text-right">{d.count}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          {packages.length > 1 ? (
            <div role="group" aria-label="Filter reviews by package" className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {["all", ...packages].map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={filter === p}
                  onClick={() => {
                    setFilter(p);
                    setShown(PAGE);
                  }}
                  className="shrink-0 rounded-full border border-ink/15 px-4 py-2 text-[0.85rem] transition-colors hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-fog"
                >
                  {p === "all" ? "All packages" : p}
                </button>
              ))}
            </div>
          ) : null}

          <ul className="flex flex-col">
            {sorted.slice(0, shown).map((r) => (
              <li key={`${r.name}-${r.date}`} className="flex flex-col gap-3 border-t border-ink/10 py-6 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-river font-display font-semibold text-jade">
                      {r.name.charAt(0)}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-semibold">{r.name}</span>
                      <span className="text-[0.8rem] text-moss">
                        {r.country ? `${r.country} · ` : ""}
                        {formatMonthYear(r.date)}
                      </span>
                    </span>
                  </div>
                  <span className="flex items-center gap-2">
                    <RatingStars value={r.rating} className="text-[0.85rem]" />
                    <span className="sr-only">{r.rating} out of 5</span>
                  </span>
                </div>
                {r.packageName ? <span className="label text-moss">{r.packageName}</span> : null}
                <p className="max-w-[68ch] leading-relaxed">{r.text}</p>
                {r.reply ? (
                  <div className="ml-4 flex flex-col gap-1 border-l-2 border-jade pl-4 text-[0.92rem]">
                    <span className="label text-moss">Reply from Kajaawa</span>
                    <p className="text-ink/80">{r.reply.text}</p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          {sorted.length > shown ? (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="self-start rounded-full border border-ink/25 px-6 py-3 font-display font-medium transition-colors hover:bg-ink hover:text-fog"
            >
              Show more reviews ({sorted.length - shown})
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
