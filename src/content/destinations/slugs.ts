/**
 * Published destination hubs. Free of server-only imports so `src/proxy.ts`
 * and `served-paths.ts` can share it. Later this list comes from the backend.
 */
export const destinationSlugs = ["meghalaya"] as const;

export const destinationPath = (slug: string) => `/destinations/${slug}/`;

/** The hub for a region name ("Meghalaya" → "/destinations/meghalaya/"), or null if none is published. */
export function destinationPathForRegion(region: string): string | null {
  const slug = region.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (destinationSlugs as readonly string[]).includes(slug) ? destinationPath(slug) : null;
}
