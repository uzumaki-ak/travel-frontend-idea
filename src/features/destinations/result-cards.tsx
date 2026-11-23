/**
 * Cab and attraction cards for the hub's mixed results grid. Same shape as the
 * tour card: tall card from sm up, a compact row (photo left) on phones.
 */
import Image from "next/image";
import type { DestinationAttraction, HubCabCard } from "@/content/destinations/schema";
import { formatInr, plural } from "@/features/experiences/format";
import { ArrowRightIcon, CarIcon, PinIcon } from "@/ui/icons";

const ARTICLE = "group/card relative flex h-full gap-4 sm:flex-col";
const PHOTO =
  "relative aspect-[4/5] w-[34%] shrink-0 self-start overflow-hidden rounded-tl-[1.5rem] rounded-br-[1.5rem] bg-cloud sm:aspect-square sm:w-auto sm:self-stretch sm:rounded-tl-[2.25rem] sm:rounded-br-[2.25rem]";
const KIND = "absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[0.75rem] font-medium text-fog sm:top-4 sm:left-4";
const TITLE = "font-display text-[1rem] leading-snug font-semibold tracking-[-0.01em] sm:text-[1.05rem]";
const SIZES = "(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 34vw";

/** A cab route. Opens the real /cars/ page. */
export function CabCard({ cab }: { cab: HubCabCard }) {
  return (
    <article className={ARTICLE}>
      <div className={PHOTO}>
        <Image src={cab.image.src} alt={cab.image.alt} fill sizes={SIZES} className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover/card:scale-[1.04]" />
        <span className={KIND}>
          <CarIcon />
          Cab
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2">
        <h3 className={TITLE}>
          <a href={cab.href} className="after:absolute after:inset-0 focus-visible:outline-none group-has-focus-visible/card:underline">
            {cab.title}
          </a>
        </h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-1 sm:pt-2">
          <span className="inline-flex items-center gap-1.5 text-[0.88rem] font-medium">
            See fares
            <ArrowRightIcon className="transition-transform duration-500 ease-out-expo group-hover/card:translate-x-1" />
          </span>
          {cab.fare ? (
            <span className="flex flex-col items-end">
              <span className="font-mono text-[1.05rem] font-semibold tabular-nums">{formatInr(cab.fare)}</span>
              <span className="text-[0.7rem] text-moss">starting fare</span>
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** An attraction. Tapping it narrows the results to the tours that visit it. */
export function AttractionCard({ attraction, tours, onPick }: { attraction: DestinationAttraction; tours: number; onPick: () => void }) {
  return (
    <article className={ARTICLE}>
      <div className={PHOTO}>
        <Image src={attraction.image.src} alt={attraction.image.alt} fill sizes={SIZES} className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover/card:scale-[1.04]" />
        <span className={KIND}>
          <PinIcon />
          Attraction
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2">
        <h3 className={TITLE}>
          <button
            type="button"
            onClick={onPick}
            className="cursor-pointer text-left after:absolute after:inset-0 focus-visible:outline-none group-has-focus-visible/card:underline"
          >
            {attraction.name}
          </button>
        </h3>
        <span className="text-[0.85rem] font-medium text-mandarin">{attraction.place}</span>
        <p className="line-clamp-2 hidden text-[0.92rem] leading-relaxed text-moss sm:block">{attraction.text}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-[0.88rem] font-medium sm:pt-2">
          {tours ? `See ${plural(tours, "tour", "tours")} that go here` : "No tours here yet"}
          <ArrowRightIcon className="transition-transform duration-500 ease-out-expo group-hover/card:translate-x-1" />
        </span>
      </div>
    </article>
  );
}
