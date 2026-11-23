import type { Destination } from "@/content/destinations/schema";
import type { HubStats } from "./destination-hero";

/** The destination's numbers: tour count, review-weighted rating, day range, lowest price. */
export function hubStats({ listings }: Destination): HubStats {
  const reviews = listings.reduce((n, l) => n + l.rating.count, 0);
  const weighted = reviews ? listings.reduce((n, l) => n + l.rating.average * l.rating.count, 0) / reviews : 0;
  const byDays = [...listings].sort((a, b) => a.days - b.days);
  const cheapest = listings.reduce((a, b) => (b.price.from < a.price.from ? b : a));
  return {
    tours: listings.length,
    rating: weighted,
    reviews,
    minDays: byDays[0]?.days ?? 0,
    maxDays: byDays.at(-1)?.days ?? 0,
    fromPrice: cheapest.price.from,
    fromUnit: cheapest.price.unit,
  };
}

/** Rail card width (phones: most of the screen, so the next card peeks in). */
export const RAIL_ITEM = "w-[60vw] max-w-[16rem] shrink-0 snap-start sm:w-[15.5rem]";
export const RAIL_SIZES = "(min-width: 640px) 248px, 60vw";
