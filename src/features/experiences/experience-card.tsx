import Image from "next/image";
import Link from "next/link";
import type { ExperienceCard as Card } from "@/content/experiences/schema";
import { experiencePath } from "@/content/experiences/slugs";
import { ClockIcon, StarIcon } from "@/ui/icons";
import { formatInr } from "./format";

/** Listing card, reused by related rails, location hubs and search results. */
export function ExperienceCard({ card, sizes = "(min-width: 1024px) 28vw, 80vw" }: { card: Card; sizes?: string }) {
  return (
    <article className="group relative flex h-full flex-col gap-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-tl-[2.25rem] rounded-br-[2.25rem] bg-cloud">
        <Image src={card.image.src} alt={card.image.alt} fill sizes={sizes} className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.05]" />
        {card.badge ? <span className="absolute top-4 left-4 rounded-full bg-mandarin px-3 py-1 label text-ink">{card.badge}</span> : null}
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-fog/90 px-3 py-1 text-[0.8rem] backdrop-blur">
          <ClockIcon />
          {card.duration.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <span className="label text-moss">
          {card.location.name}, {card.location.region}
        </span>
        <h3 className="font-display text-[1.15rem] leading-snug font-semibold tracking-[-0.01em]">
          <Link href={experiencePath(card.slug)} className="after:absolute after:inset-0 focus-visible:outline-none group-has-focus-visible:underline">
            {card.title}
          </Link>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          {card.rating.count ? (
            <span className="flex items-center gap-1 text-[0.9rem]">
              <StarIcon className="text-mandarin" />
              <span className="font-semibold tabular-nums">{card.rating.average.toFixed(1)}</span>
              <span className="text-moss tabular-nums">({card.rating.count})</span>
            </span>
          ) : (
            <span />
          )}
          <span className="flex flex-col items-end">
            <span className="text-[0.75rem] text-moss">From</span>
            <span className="font-mono font-semibold tabular-nums">
              {card.compareAt && card.compareAt > card.fromPrice ? <s className="mr-2 text-[0.8rem] font-normal text-moss">{formatInr(card.compareAt)}</s> : null}
              {formatInr(card.fromPrice)}
            </span>
            <span className="text-[0.7rem] text-moss">{card.fromUnit}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
