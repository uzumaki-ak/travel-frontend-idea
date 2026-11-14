import { NextResponse, type NextRequest } from "next/server";
import tourIndex from "@/content/tours/index.json";

/**
 * Unknown tour URLs must answer with a real 404 status (not a 200 "not found"
 * page), so search engines never index them. Prerendered pages stream their
 * shell before the page can call notFound(), so the check happens here, before
 * rendering. Only /tours/* runs through this.
 */
const knownTours = new Set(tourIndex.tours.map((t) => t.slug));

export function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/tours\/([^/]+)\/?$/);
  if (match && !knownTours.has(match[1])) {
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
  matcher: "/tours/:slug/",
};
