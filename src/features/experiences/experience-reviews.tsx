"use client";

/**
 * Reviews: overall score, per-aspect bars, star distribution, and the list,
 * newest first. Phones: every review in a sideways-swipe row. Tablet up: a list,
 * four at a time.
 */
import { useMemo, useState } from "react";
import type { Experience } from "@/content/experiences/schema";
import { formatMonthYear, plural } from "./format";
import { RatingStars } from "./rating-stars";

const PAGE = 4;

export function ExperienceReviews({ rating, reviews }: { rating: Experience["rating"]; reviews: Experience["reviews"] }) {
  const [shown, setShown] = useState(PAGE);
  const sorted = useMemo(() => [...reviews].sort((a, b) => b.date.localeCompare(a.date)), [reviews]);
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((r) => r.rating === stars).length }));

  if (!reviews.length && !rating.count) return null;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-32 md:scroll-mt-44 flex flex-col gap-10">
      <h2 id="reviews-title" data-motion="lines" className="font-display text-title font-bold tracking-[-0.03em]">
        What travellers say
      </h2>

      <div className="grid gap-10">
        <div className="grid gap-8 md:grid-cols-2">
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

        <div className="flex min-w-0 flex-col gap-6">
          <ul className="scrollbar-none relative -mx-(--gutter-x) flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter-x) px-(--gutter-x) pb-1 md:mx-0 md:flex-col md:gap-0 md:overflow-visible md:px-0 md:pb-0">
            {sorted.map((r, i) => (
              <li
                key={`${r.name}-${r.date}`}
                className={`flex w-[85%] shrink-0 snap-start flex-col gap-3 rounded-tl-[1.75rem] rounded-br-[1.75rem] bg-cloud p-5 md:w-auto md:rounded-none md:border-t md:border-ink/10 md:bg-transparent md:px-0 md:py-6 md:first:border-t-0 md:first:pt-0 ${i >= shown ? "md:hidden" : ""}`}
              >
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
              className="hidden self-start rounded-full border border-ink/25 px-6 py-3 font-display font-medium transition-colors hover:bg-ink hover:text-fog md:block"
            >
              Show more reviews ({sorted.length - shown})
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
