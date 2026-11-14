import "server-only";
import { legacyUrl } from "@/config/site";
import tourIndex from "./tours/index.json";

/**
 * Which original URLs this app now serves. Everything else still points at the
 * WordPress site, so no link breaks while pages are migrated one group at a time.
 * Add a path group here when its pages are rebuilt.
 */
const servedPaths = new Set<string>(["/", ...tourIndex.tours.map((t) => `/tours/${t.slug}/`)]);

/** Resolves an original site path to where that page lives today. External links pass through. */
export function resolveSitePath(path: string): string {
  if (/^(https?:|mailto:|tel:)/.test(path)) return path;
  return servedPaths.has(path) ? path : legacyUrl(path);
}
