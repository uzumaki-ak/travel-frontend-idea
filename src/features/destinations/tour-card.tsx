"use client";

/**
 * A tour as listed on a destination hub. The whole card opens the tour's
 * experience page. With `gallery`, the photo area flips through the tour's
 * photos: dots everywhere, arrows on hover (desktop), swipe on touch screens.
 * Rails use it without a gallery, so a sideways swipe scrolls the rail instead.
 */
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { DestinationListing } from "@/content/destinations/schema";
import { experiencePath } from "@/content/experiences/slugs";
import { formatInr, savingPercent } from "@/features/experiences/format";
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon, StarIcon } from "@/ui/icons";

type Props = {
  listing: DestinationListing;
  /** Photo gallery with dots and arrows (grid cards). Off for rail cards. */
  gallery?: boolean;
  /** Show the one-line summary (grid cards). */
  summary?: boolean;
  /** Phones: a compact row (photo left, details right) instead of a tall card. */
  rowOnPhone?: boolean;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
};

const SWIPE_PX = 40;

export function TourCard({ listing, gallery = false, summary = false, rowOnPhone = false, sizes = "(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 85vw", className = "", style }: Props) {
  const photos = gallery ? listing.images : listing.images.slice(0, 1);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);
  const go = (step: number) => setIndex((i) => (i + step + photos.length) % photos.length);
  const { price } = listing;
  const saving = savingPercent(price.from, price.compareAt);
  const href = experiencePath(listing.experience);
  const row = rowOnPhone;

  return (
    <article className={`group/card relative flex h-full ${row ? "gap-4 sm:flex-col" : "flex-col gap-4"} ${className}`} style={style}>
      <div
        className={`relative overflow-hidden bg-cloud ${
          row
            ? "aspect-[3/4] w-[40%] shrink-0 self-start rounded-tl-[1.5rem] rounded-br-[1.5rem] sm:aspect-[4/5] sm:w-auto sm:self-stretch sm:rounded-tl-[2.25rem] sm:rounded-br-[2.25rem]"
            : "aspect-[4/5] rounded-tl-[2.25rem] rounded-br-[2.25rem]"
        }`}
        onTouchStart={photos.length > 1 ? (e) => (touchX.current = e.touches[0]?.clientX ?? null) : undefined}
        onTouchEnd={
          photos.length > 1
            ? (e) => {
                const start = touchX.current;
                const end = e.changedTouches[0]?.clientX;
                touchX.current = null;
                if (start == null || end == null || Math.abs(end - start) < SWIPE_PX) return;
                swiped.current = true; // the tap that ends a swipe must not open the tour
                go(end < start ? 1 : -1);
              }
            : undefined
        }
      >
        {photos.map((p, i) => (
          <Image
            key={p.src}
            src={p.src}
            alt={i === 0 ? p.alt : ""}
            fill
            sizes={sizes}
            className={`object-cover transition-[opacity,scale] duration-700 ease-out-expo group-hover/card:scale-[1.04] ${i === index ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        {/* Soft fade so the pills stay legible on bright photos. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-river-deep/45 to-transparent" />

        {listing.badge ? <span className={`absolute z-10 rounded-full bg-mandarin label text-ink ${row ? "top-2.5 left-2.5 px-2 py-0.5 sm:top-4 sm:left-4 sm:px-3 sm:py-1" : "top-4 left-4 px-3 py-1"}`}>{listing.badge}</span> : null}
        {saving ? <span className={`absolute top-4 right-4 z-10 rounded-full bg-jade px-2.5 py-1 label text-river-deep ${row ? "hidden sm:block" : ""}`}>−{saving}%</span> : null}
        <span className={`absolute bottom-4 left-4 z-10 items-center gap-1.5 rounded-full bg-fog/90 px-3 py-1 text-[0.8rem] backdrop-blur ${row ? "hidden sm:inline-flex" : "inline-flex"}`}>
          <ClockIcon />
          {listing.durationLabel}
        </span>

        {photos.length > 1 ? (
          <>
            <span className={`absolute z-20 flex items-center gap-1.5 ${row ? "inset-x-0 bottom-2 justify-center sm:inset-x-auto sm:right-4 sm:bottom-5" : "right-4 bottom-5"}`}>
              {photos.map((p, i) => (
                <button
                  key={p.src}
                  type="button"
                  aria-label={`Photo ${i + 1} of ${photos.length}`}
                  aria-pressed={i === index}
                  onClick={() => setIndex(i)}
                  className="grid size-4 cursor-pointer place-items-center"
                >
                  <span className={`block rounded-full bg-fog transition-all duration-300 ${i === index ? "h-1.5 w-4" : "size-1.5 opacity-60"}`} />
                </button>
              ))}
            </span>
            <span className="pointer-events-none absolute inset-x-3 top-1/2 z-20 hidden -translate-y-1/2 justify-between opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 md:flex">
              <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className="pointer-events-auto grid size-9 cursor-pointer place-items-center rounded-full bg-fog/90 text-ink backdrop-blur transition-colors hover:bg-fog">
                <ArrowLeftIcon />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => go(1)} className="pointer-events-auto grid size-9 cursor-pointer place-items-center rounded-full bg-fog/90 text-ink backdrop-blur transition-colors hover:bg-fog">
                <ArrowRightIcon />
              </button>
            </span>
          </>
        ) : null}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col ${row ? "gap-1.5 sm:gap-2" : "gap-2"}`}>
        <h3 className={`font-display leading-snug font-semibold tracking-[-0.01em] ${row ? "line-clamp-3 text-[1rem] sm:line-clamp-none sm:text-[1.12rem]" : "text-[1.12rem]"}`}>
          <Link
            href={href}
            onClick={(e) => {
              if (swiped.current) {
                e.preventDefault();
                swiped.current = false;
              }
            }}
            // The link covers the whole card; the gallery controls sit above it (z-20).
            className="after:absolute after:inset-0 after:z-[5] focus-visible:outline-none group-has-focus-visible/card:underline"
          >
            {listing.title}
          </Link>
        </h3>
        {listing.route.length ? (
          <span className="flex min-w-0 items-center gap-1.5 text-[0.85rem] text-moss">
            <span className="truncate">{listing.route.slice(0, 2).join(" › ")}</span>
            {listing.route.length > 2 ? <span className="shrink-0 text-mandarin">+{listing.route.length - 2}</span> : null}
          </span>
        ) : null}
        {row ? (
          <span className="inline-flex items-center gap-1.5 text-[0.82rem] text-moss sm:hidden">
            <ClockIcon />
            {listing.durationLabel}
          </span>
        ) : null}
        {summary ? <p className={`line-clamp-2 text-[0.92rem] leading-relaxed text-moss ${row ? "hidden sm:block" : ""}`}>{listing.summary}</p> : null}
        <div className={`mt-auto flex items-end justify-between gap-3 ${row ? "pt-1 sm:pt-2" : "pt-2"}`}>
          {listing.rating.count ? (
            <span className="flex items-center gap-1 text-[0.9rem]">
              <StarIcon className="text-mandarin" />
              <span className="font-semibold tabular-nums">{listing.rating.average.toFixed(1)}</span>
              <span className="text-moss tabular-nums">({listing.rating.count})</span>
            </span>
          ) : (
            <span />
          )}
          <span className="flex flex-col items-end">
            {price.compareAt && saving ? <s className="font-mono text-[0.78rem] text-moss tabular-nums">{formatInr(price.compareAt)}</s> : null}
            <span className="font-mono text-[1.05rem] font-semibold tabular-nums">{formatInr(price.from)}</span>
            <span className="text-[0.7rem] text-moss">{price.unit}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
