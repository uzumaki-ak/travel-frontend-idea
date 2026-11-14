/**
 * Which original URLs this app serves (everything else still lives on the
 * WordPress site). Kept free of server-only imports so both the route resolver
 * and `src/proxy.ts` can use it. Add a path group here when its pages are rebuilt.
 */
import cabIndex from "./cabs/index.json";
import tourArchive from "./tour-archive.json";
import tourIndex from "./tours/index.json";

const archivePages = Array.from({ length: Math.max(0, tourArchive.lastPagedUrl - 1) }, (_, i) => `/tours/page/${i + 2}/`);

export const servedPaths: ReadonlySet<string> = new Set<string>([
  "/",
  "/tours/",
  ...archivePages,
  ...tourIndex.tours.map((t) => `/tours/${t.slug}/`),
  "/cars/",
  ...cabIndex.slugs.map((s) => `/cars/${s}/`),
]);

export const isServedPath = (path: string) => servedPaths.has(path);
