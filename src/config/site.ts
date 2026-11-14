/**
 * Public site configuration. The only module that reads public env vars.
 *
 * Pages not rebuilt yet still live on the WordPress site. Their links keep the
 * exact original paths and point at `legacyOrigin`; see `src/content/routes.ts`
 * for which paths are served by this app.
 */
const DEFAULT_LEGACY_ORIGIN = "https://www.kajaawa.com";

const legacyOrigin = (process.env.NEXT_PUBLIC_LEGACY_SITE_ORIGIN ?? DEFAULT_LEGACY_ORIGIN).replace(/\/$/, "");

export const siteConfig = {
  name: "Kajaawa",
  url: "https://www.kajaawa.com",
  legacyOrigin,
} as const;

/** Absolute URL of an original path on the WordPress site. */
export function legacyUrl(path: string): string {
  return `${siteConfig.legacyOrigin}${path}`;
}
