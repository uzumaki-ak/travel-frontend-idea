/**
 * Published destination hubs. Free of server-only imports so `src/proxy.ts`
 * and `served-paths.ts` can share it. Later this list comes from the backend.
 */
export const destinationSlugs = ["meghalaya"] as const;

export const destinationPath = (slug: string) => `/destinations/${slug}/`;
/** The destination's full tour list (child of the destination page). */
export const destinationToursPath = (slug: string) => `/destinations/${slug}/tours/`;
/** The destination's own pages under its overview. */
export const destinationSections = ["tours", "experiences", "attractions", "reviews"] as const;
export type DestinationSection = (typeof destinationSections)[number];
/**
 * Section pages that are open to visitors. Experiences and attractions get their
 * own detailed pages later; until then their tabs show but do not link, and their
 * URLs return 404.
 */
export const liveDestinationSections: readonly DestinationSection[] = ["tours", "reviews"];
export const destinationSectionPath = (slug: string, section: DestinationSection) => `/destinations/${slug}/${section}/`;

/** The hub for a region name ("Meghalaya" → "/destinations/meghalaya/"), or null if none is published. */
export function destinationPathForRegion(region: string): string | null {
  const slug = region.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (destinationSlugs as readonly string[]).includes(slug) ? destinationPath(slug) : null;
}
