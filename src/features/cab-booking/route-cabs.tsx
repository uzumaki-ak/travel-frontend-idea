"use client";

/**
 * A route page's cab list: every cab with its one-way fare and the same-day
 * round trip beside it. Choosing one opens the search for this route with that
 * cab already picked (its Review booking opens straight away).
 */
import { useRouter } from "next/navigation";
import { CabRow } from "./cab-rows";
import type { CabQuote } from "./review-types";
import { routeSearchHref } from "./search";

export function RouteCabs({ from, to, quotes, freeCancelHours }: { from: string; to: string; quotes: CabQuote[]; freeCancelHours: number }) {
  const router = useRouter();
  return (
    <ul className="flex flex-col gap-3">
      {quotes.map((q) => (
        <li key={q.vehicle.id}>
          <CabRow quote={q} freeCancelHours={freeCancelHours} selectLabel="Book" onSelect={() => router.push(routeSearchHref(from, to, q.vehicle.id))} />
        </li>
      ))}
    </ul>
  );
}
