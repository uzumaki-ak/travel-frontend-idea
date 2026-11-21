import { NextResponse, type NextRequest } from "next/server";
import { legacyUrl } from "@/config/site";
import cabIndex from "@/content/cabs/index.json";
import cabRedirects from "@/content/cabs/redirects.json";
import { destinationSlugs } from "@/content/destinations/slugs";
import { experienceSlugs } from "@/content/experiences/slugs";
import { isServedPath } from "@/content/served-paths";
import tourArchive from "@/content/tour-archive.json";
import tourIndex from "@/content/tours/index.json";

/**
 * Runs only on /tours/*, /cars/*, /experiences/* and /destinations/*, before rendering:
 *  - redirects that the live site performs (301), to the same targets;
 *  - a real 404 status for unknown slugs (prerendered pages stream their shell
 *    before a page could call notFound(), which would leave a 200).
 */
const knownTours = new Set(tourIndex.tours.map((t) => t.slug));
const knownCabs = new Set(cabIndex.slugs);
const knownExperiences = new Set<string>(experienceSlugs);
const knownDestinations = new Set<string>(destinationSlugs);
const lastPagedUrl = tourArchive.lastPagedUrl;
const redirects = new Map<string, string>(cabRedirects.map((r) => [r.from, r.to]));

/** Same redirects as the live site. Returns a site path, or null. */
function redirectTarget(pathname: string): string | null {
  const exact = redirects.get(pathname.endsWith("/") ? pathname : `${pathname}/`);
  if (exact) return exact;
  const paged = pathname.match(/^\/tours\/page\/(\d+)\/?$/);
  if (!paged) return null;
  const n = Number(paged[1]);
  if (n === 1) return "/tours/";
  if (String(n) !== paged[1] && n >= 2 && n <= lastPagedUrl) return `/tours/page/${n}/`;
  return null;
}

function isKnown(pathname: string): boolean {
  const paged = pathname.match(/^\/tours\/page\/(\d+)\/?$/);
  if (paged) {
    const n = Number(paged[1]);
    return String(n) === paged[1] && n >= 2 && n <= lastPagedUrl;
  }
  const tour = pathname.match(/^\/tours\/([^/]+)\/?$/);
  if (tour) return knownTours.has(tour[1]);
  const cab = pathname.match(/^\/cars\/([^/]+)\/?$/);
  if (cab) return knownCabs.has(cab[1]);
  const experience = pathname.match(/^\/experiences\/([^/]+)\/?$/);
  if (experience) return knownExperiences.has(experience[1]);
  const destination = pathname.match(/^\/destinations\/([^/]+)\/?$/);
  if (destination) return knownDestinations.has(destination[1]);
  return true;
}

/** Absolute URL on the public host. Behind nginx the app's own URL is internal (localhost:3120). */
function publicUrl(request: NextRequest, path: string): URL {
  const host = request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") === "https" ? "https" : request.nextUrl.protocol.replace(":", "");
  if (/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return new URL(path, `${proto}://${host}`);
  return Object.assign(request.nextUrl.clone(), { pathname: path });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const to = redirectTarget(pathname);
  if (to) {
    // Pages not rebuilt yet still live on WordPress; send visitors there instead of a 404.
    const target = isServedPath(to) ? publicUrl(request, to) : new URL(legacyUrl(to));
    return NextResponse.redirect(target, 301);
  }

  if (!isKnown(pathname)) {
    // No route exists at this path, so Next renders app/not-found.tsx with status 404.
    //
    // Why the target is forced to plain http: on the VPS the app runs with
    // `next start -H 127.0.0.1` behind nginx (X-Forwarded-Proto: https). Next compares
    // rewrites against "https://127.0.0.1:<port>", but inside the proxy every URL's
    // host is normalised to "localhost", so the origins never match and Next proxies
    // the rewrite to itself over the network. With an https target that hits the
    // plain-http port and fails (500). With http it reaches this same server and
    // returns the not-found page with status 404. The target is fixed — this app's
    // own not-found route on its own port — and never built from request input.
    const target = request.nextUrl.clone();
    target.protocol = "http:";
    target.pathname = "/__not-found__/";
    target.search = "";
    return NextResponse.rewrite(target);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/tours/:slug/", "/tours/page/:n/", "/cars/:slug/", "/experiences/:slug/", "/destinations/:slug/"],
};
