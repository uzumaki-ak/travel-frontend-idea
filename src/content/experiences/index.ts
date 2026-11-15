/**
 * Content provider for experiences. Pages only talk to these functions, so
 * swapping the sample JSON for the admin backend later is a change in this file only.
 */
import "server-only";
import { experienceSchema, type Experience, type ExperienceCard } from "./schema";
import { experienceSlugs } from "./slugs";

const known = new Set<string>(experienceSlugs);

export function listExperienceSlugs(): string[] {
  return [...experienceSlugs];
}

/** One experience, or null for unknown slugs (checked before any file is touched). */
export async function getExperience(slug: string): Promise<Experience | null> {
  if (!known.has(slug)) return null;
  const data = (await import(`./data/${slug}.json`)).default;
  return experienceSchema.parse(data);
}

export type FromPrice = { price: number; compareAt?: number; unit: "per person" | "per group" };

/** Cheapest price across every package and option, with its "was" price and what it covers. */
export function fromPrice(experience: Experience): FromPrice {
  let best: FromPrice | null = null;
  for (const pkg of experience.packages) {
    for (const option of pkg.priceOptions) {
      if (best && option.price >= best.price) continue;
      const unit = pkg.pricingMode === "per-unit" || option.guests.max === 1 ? "per person" : "per group";
      best = { price: option.price, compareAt: option.compareAt, unit };
    }
  }
  return best ?? { price: 0, unit: "per group" };
}

export function toCard(experience: Experience): ExperienceCard {
  const { price, compareAt, unit } = fromPrice(experience);
  return {
    slug: experience.slug,
    title: experience.title,
    location: experience.location,
    duration: experience.duration,
    rating: experience.rating,
    badge: experience.badge,
    image: experience.gallery[0],
    fromPrice: price,
    fromUnit: unit,
    compareAt,
  };
}

/** Cards for the given slugs, skipping unknown ones, in the given order. */
export async function getExperienceCards(slugs: readonly string[]): Promise<ExperienceCard[]> {
  const items = await Promise.all(slugs.map((s) => getExperience(s)));
  return items.filter((e): e is Experience => e !== null).map(toCard);
}
