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
    return NextResponse.rewrite(new URL("/__not-found__/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/tours/:slug/",
};
