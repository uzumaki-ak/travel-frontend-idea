/**
 * Content provider for destination hubs. Pages only talk to these functions, so
 * swapping the sample JSON for the admin backend later is a change in this file only.
 */
import "server-only";
import { getCabPage } from "../cabs";
import { destinationSchema, type Destination, type HubCabCard } from "./schema";
import { destinationSlugs } from "./slugs";

const known = new Set<string>(destinationSlugs);

export function listDestinationSlugs(): string[] {
  return [...destinationSlugs];
}

/** One hub, or null for unknown slugs. Listings come back sorted by `rank`. */
export async function getDestination(slug: string): Promise<Destination | null> {
  if (!known.has(slug)) return null;
  const data = (await import(`./data/${slug}.json`)).default;
  const destination = destinationSchema.parse(data);
  return { ...destination, listings: [...destination.listings].sort((a, b) => a.rank - b.rank) };
}

/** The hub's cab routes as cards. Titles come from the cab pages themselves (their h1). */
export async function getHubCabs(destination: Destination): Promise<HubCabCard[]> {
  const pages = await Promise.all(destination.cabs.map((c) => getCabPage(c.slug)));
  return destination.cabs.flatMap((c, i) => {
    const page = pages[i];
    if (!page) return [];
    const h1 = page.blocks.find((b) => b.type === "heading" && b.level === 1);
    const title = h1 && h1.type === "heading" ? h1.text : c.slug.replace(/-/g, " ");
    return [{ slug: c.slug, title, href: `/cars/${c.slug}/`, image: c.image, fare: c.fare, themes: c.themes }];
  });
}
