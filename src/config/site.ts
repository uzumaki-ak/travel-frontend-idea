/**
 * Public site configuration. The only module that reads public env vars.
 *
 * Until the rest of the site is migrated, every inner page (tours, cabs,
 * tourism guides) still lives on the WordPress site. Links keep their exact
 * original paths and are resolved against `LEGACY_SITE_ORIGIN`; once those
 * pages are rebuilt here, set it to an empty string and links become relative.
 */
const DEFAULT_LEGACY_ORIGIN = "https://www.kajaawa.com";

const legacyOrigin = (process.env.NEXT_PUBLIC_LEGACY_SITE_ORIGIN ?? DEFAULT_LEGACY_ORIGIN).replace(/\/$/, "");

export const siteConfig = {
  name: "Kajaawa",
  url: "https://www.kajaawa.com",
  legacyOrigin,
} as const;

/** Resolves an original site path (e.g. `/tours/x/`) to where that page lives today. */
export function resolveSitePath(path: string): string {
  if (/^(https?:|mailto:|tel:)/.test(path)) return path;
  if (path === "/") return "/"; // the homepage is this app

  return `${siteConfig.legacyOrigin}${path}`;
}
