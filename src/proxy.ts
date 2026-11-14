import { NextResponse, type NextRequest } from "next/server";
import tourArchive from "@/content/tour-archive.json";
import tourIndex from "@/content/tours/index.json";

/**
 * Unknown tour URLs must answer with a real 404 status (not a 200 "not found"
 * page), so search engines never index them. Prerendered pages stream their
 * shell before the page can call notFound(), so the check happens here, before
 * rendering. Only /tours/* runs through this.
 */
const knownTours = new Set(tourIndex.tours.map((t) => t.slug));
const lastPagedUrl = tourArchive.lastPagedUrl;

function isKnown(pathname: string): boolean {
  const paged = pathname.match(/^\/tours\/page\/(\d+)\/?$/);
  if (paged) {
    const n = Number(paged[1]);
    return String(n) === paged[1] && n >= 2 && n <= lastPagedUrl;
  }
  const tour = pathname.match(/^\/tours\/([^/]+)\/?$/);
  return tour ? knownTours.has(tour[1]) : true;
}

/** Same redirects as the live site: /tours/page/1/ → /tours/, /tours/page/02/ → /tours/page/2/. */
function pagedRedirect(pathname: string): string | null {
  const paged = pathname.match(/^\/tours\/page\/(\d+)\/?$/);
  if (!paged) return null;
  const n = Number(paged[1]);
  if (n === 1) return "/tours/";
  if (String(n) !== paged[1] && n >= 2 && n <= lastPagedUrl) return `/tours/page/${n}/`;
  return null;
}

export function proxy(request: NextRequest) {
  const redirectTo = pagedRedirect(request.nextUrl.pathname);
  if (redirectTo) {
    // Behind nginx the app's own URL is the internal one (localhost:3120), so build the target
    // from the public Host / X-Forwarded-Proto that nginx passes on. Host is validated as a
    // plain hostname[:port] before use.
    const host = request.headers.get("host") ?? "";
    const proto = request.headers.get("x-forwarded-proto") === "https" ? "https" : request.nextUrl.protocol.replace(":", "");
    const target = /^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)
      ? new URL(redirectTo, `${proto}://${host}`)
      : Object.assign(request.nextUrl.clone(), { pathname: redirectTo });
    return NextResponse.redirect(target, 301);
  }

  if (!isKnown(request.nextUrl.pathname)) {
    // No route exists at this path, so Next renders app/not-found.tsx with status 404.
    // Clone nextUrl (don't build from request.url): behind nginx, request.url carries the
    // public "https" scheme, which would turn this into an external rewrite and fail.
    const target = request.nextUrl.clone();
    target.pathname = "/__not-found__/";
    return NextResponse.rewrite(target);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/tours/:slug/", "/tours/page/:n/"],
};
