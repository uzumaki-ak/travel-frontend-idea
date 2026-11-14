import "server-only";
import { legacyUrl } from "@/config/site";
import { isServedPath } from "./served-paths";

/** Resolves an original site path to where that page lives today. External links pass through. */
export function resolveSitePath(path: string): string {
  if (/^(https?:|mailto:|tel:)/.test(path)) return path;
  return isServedPath(path) ? path : legacyUrl(path);
}
