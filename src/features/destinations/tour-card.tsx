"use client";

/**
 * A tour as listed on a destination hub. The whole card opens the tour's
 * experience page. With `gallery`, the photo area flips through the tour's
 * photos: a strip you scroll by hand on touch screens (it follows the finger and
 * snaps), dots that track it, arrows on hover (desktop). Rails use it without a
 * gallery, so a sideways swipe scrolls the rail instead.
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

export function TourCard({ listing, gallery = false, summary = false, rowOnPhone = false, sizes = "(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 85vw", className = "", style }: Props) {
  const photos = gallery ? listing.images : listing.images.slice(0, 1);
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const go = (to: number) => {
    const el = strip.current;
    if (!el) return;
    const next = (to + photos.length) % photos.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };
  const { price } = listing;
  const saving = savingPercent(price.from, price.compareAt);
  const href = experiencePath(listing.experience);
  const row = rowOnPhone;

  return (
    <article className={`group/card relative flex h-full ${row ? "gap-4 sm:flex-col" : "flex-col gap-4"} ${className}`} style={style}>
      <div
        className={`relative overflow-hidden bg-cloud ${
          row
            ? "aspect-square w-[31%] shrink-0 self-start rounded-lg sm:w-auto sm:self-stretch sm:rounded-xl"
            : "aspect-square rounded-xl"
        }`}
      >
        {/* The photos: a scroll-snap strip, so a swipe moves with the finger. Each slide is a
            link to the tour (hidden from screen readers; the title link is the real one). */}
        <div
          ref={strip}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
            if (i !== index) setIndex(i);
          }}
          className={`scrollbar-none absolute inset-0 z-[6] flex overscroll-x-contain ${photos.length > 1 ? "snap-x snap-mandatory overflow-x-auto" : "overflow-hidden"}`}
        >
          {photos.map((p) => (
            <Link key={p.src} href={href} tabIndex={-1} aria-hidden="true" className="relative block h-full w-full shrink-0 snap-center snap-always overflow-hidden">
              <Image
                src={p.src}
                alt=""
                fill
                sizes={sizes}
                className="object-cover transition-[scale] duration-700 ease-out-expo group-hover/card:scale-[1.04]"
              />
            </Link>
          ))}
        </div>
        {/* Soft fade so the pills stay legible on bright photos. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[7] h-1/3 bg-gradient-to-t from-river-deep/45 to-transparent" />

        {listing.badge ? <span className={`pointer-events-none absolute z-10 rounded-full bg-mandarin label text-ink ${row ? "top-2.5 left-2.5 px-2 py-0.5 sm:top-4 sm:left-4 sm:px-3 sm:py-1" : "top-4 left-4 px-3 py-1"}`}>{listing.badge}</span> : null}
        {saving ? <span className={`pointer-events-none absolute top-4 right-4 z-10 rounded-full bg-jade px-2.5 py-1 label text-river-deep ${row ? "hidden sm:block" : ""}`}>−{saving}%</span> : null}
        <span className={`pointer-events-none absolute bottom-4 left-4 z-10 items-center gap-1.5 rounded-full bg-fog/90 px-3 py-1 text-[0.8rem] backdrop-blur ${row ? "hidden sm:inline-flex" : "inline-flex"}`}>
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
                  onClick={() => go(i)}
                  className="grid size-4 cursor-pointer place-items-center"
                >
                  <span className={`block rounded-full bg-fog transition-all duration-300 ${i === index ? "h-1.5 w-4" : "size-1.5 opacity-60"}`} />
                </button>
              ))}
            </span>
            <span className="pointer-events-none absolute inset-x-3 top-1/2 z-20 hidden -translate-y-1/2 justify-between opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 md:flex">
              <button type="button" aria-label="Previous photo" onClick={() => go(index - 1)} className="pointer-events-auto grid size-9 cursor-pointer place-items-center rounded-full bg-fog/90 text-ink backdrop-blur transition-colors hover:bg-fog">
                <ArrowLeftIcon />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => go(index + 1)} className="pointer-events-auto grid size-9 cursor-pointer place-items-center rounded-full bg-fog/90 text-ink backdrop-blur transition-colors hover:bg-fog">
                <ArrowRightIcon />
              </button>
            </span>
          </>
        ) : null}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col ${row ? "gap-1.5 sm:gap-2" : "gap-2"}`}>
        <h3 className={`font-display leading-snug font-semibold tracking-[-0.01em] ${row ? "line-clamp-3 text-[1rem] sm:line-clamp-none sm:text-[1rem]" : "text-[1rem]"}`}>
          <Link
            href={href}
            // The link covers the whole card; the photo strip (z-6) and gallery controls (z-20) sit above it.
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
            <span className="font-mono text-[1rem] font-semibold tabular-nums">{formatInr(price.from)}</span>
            <span className="text-[0.7rem] text-moss">{price.unit}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
