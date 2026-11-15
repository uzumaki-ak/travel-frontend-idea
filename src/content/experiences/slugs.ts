/**
 * Published experience slugs. Free of server-only imports so `src/proxy.ts`
 * and `served-paths.ts` can share it. Later this list comes from the backend.
 */
export const experienceSlugs = ["shillong-cherrapunji-dawki-escape", "dawki-mawlynnong-day-trip", "shillong-after-dark"] as const;

export const experiencePath = (slug: string) => `/experiences/${slug}/`;
