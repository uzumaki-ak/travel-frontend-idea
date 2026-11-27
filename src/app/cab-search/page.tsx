import type { Metadata } from "next";
import { Suspense } from "react";
import { airportQuotes, boxConfig, cabSettings, findRoute, getCatalog, hourlyQuotes, outstationQuotes, slabLabel, type CabQuote } from "@/content/cab-booking";
import type { BoxInitial } from "@/features/cab-booking/booking-box";
import { ResultsView } from "@/features/cab-booking/results-view";
import type { ReviewTrip, TravellerKind } from "@/features/cab-booking/review-types";
import { clock, defaultPickup, instant, pickupProblem, returnProblem, toWhen, tripDays, whenLabel, type When } from "@/features/cab-booking/rules";
import { parseSearch } from "@/features/cab-booking/search";
import { SiteShell } from "@/features/site-chrome/site-shell";

export const metadata: Metadata = {
  title: "Search Cabs",
  // Search results are never indexed (as on the old site).
  robots: { index: false, follow: true },
};

/** Cab search results for Outstation, Airport and Hourly. */
export default function CabSearchPage({ searchParams }: PageProps<"/cab-search">) {
  return (
    <SiteShell section="/cars/">
      <div className="wrap pt-[calc(var(--header-h)+1.5rem)] pb-24 md:pt-[calc(var(--header-h)+3rem)] md:pb-32">
        <h1 className="sr-only">Search cabs</h1>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-cloud" />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </SiteShell>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/cab-search">["searchParams"] }) {
  const parsed = parseSearch(await searchParams);
  const s = cabSettings();
  const config = boxConfig();
  // Read after the request data, so this runs per request (never at build time).
  const now = clock();
  // Links from route cards carry no date: start from the default pickup (tomorrow, 9 AM).
  const q = parsed.pickup.date ? parsed : { ...parsed, pickup: defaultPickup(s, now) };

  const errors: string[] = [];
  const pickupOk = !!instant(q.pickup);
  const problem = pickupProblem(q.pickup, q.service, s, now);
  if (problem) errors.push(problem);
  if (q.service === "outstation" && q.trip === "round") {
    const r = q.ret ? returnProblem(q.pickup, q.ret, s, now) : "Please choose a return date and time.";
    if (r && !problem) errors.push(r);
  }

  const when = pickupOk ? whenLabel(q.pickup) : "";
  let initial: BoxInitial;
  let summary: { title: string; chip: string; when: string };
  let missing: string | null = null;
  let banner: string | null = null;
  let daysNote: string | null = null;
  let quotes: CabQuote[] = [];
  let tripBase: { kind: TravellerKind; label: string; from: string; to: string; places: string[]; dropNote?: string } | null = null;

  if (q.service === "outstation") {
    initial = { tab: "outstation", trip: q.trip, from: q.from, to: q.to, ...(pickupOk ? { pickup: q.pickup } : {}), ret: q.ret };
    const route = q.from && q.to ? findRoute(q.from, q.to) : null;
    summary = {
      title: `${route?.from ?? q.from} → ${route?.to ?? q.to}`,
      chip: q.trip === "round" ? "Round Trip" : "One Way",
      when: q.trip === "round" && q.ret && instant(q.ret) ? `${when} – ${whenLabel(q.ret)}` : when,
    };
    if (!q.from || !q.to) errors.push("Please enter the pickup and drop locations.");
    else if (!route) missing = `We do not have an online fare for ${q.from} to ${q.to} yet, but we can still arrange your cab.`;
    else {
      banner = [route.distanceKm ? `Distance ${route.distanceKm.toLocaleString("en-IN")} km` : "", route.duration].filter(Boolean).join(" | ") + (q.trip === "round" ? " (each way)" : "");
      const days = q.trip === "round" && q.ret && instant(q.ret) ? tripDays(q.pickup, q.ret) : 1;
      if (days > 1) daysNote = `Round trip over ${days} days. The cab stays with you until your return.`;
      quotes = outstationQuotes(route, { trip: q.trip, pickup: q.pickup, ret: q.ret });
      tripBase = { kind: "outstation", label: q.trip === "round" ? "Outstation Round Trip" : "Outstation One Way Trip", from: route.from, to: route.to, places: [route.from, route.to] };
    }
  } else if (q.service === "airport") {
    initial = { tab: "airport", dir: q.dir, from: q.from, to: q.to, ...(pickupOk ? { pickup: q.pickup } : {}) };
    summary = { title: `${q.from} → ${q.to}`, chip: "Airport", when: `${q.dir === "from" ? "Pickup from Airport" : "Drop to Airport"}${when ? ` · ${when}` : ""}` };
    const found = q.from && q.to ? airportQuotes(q.dir, q.from, q.to, q.pickup) : null;
    if (!q.from || !q.to) errors.push("Please enter where the trip starts and ends.");
    else if (!found) missing = `We do not have an online fare for ${q.from} to ${q.to} yet, but we can still arrange your cab.`;
    else {
      const t = found.transfer;
      banner = [t.distanceKm ? `Distance ${t.distanceKm.toLocaleString("en-IN")} km` : "", t.duration].filter(Boolean).join(" | ");
      quotes = found.quotes;
      tripBase = { kind: q.dir === "from" ? "airport-pickup" : "airport-drop", label: q.dir === "from" ? "Airport Pickup" : "Airport Drop", from: q.from, to: q.to, places: [q.from, q.to] };
    }
  } else {
    initial = { tab: "hourly", city: q.city, slab: q.slab, ...(pickupOk ? { pickup: q.pickup } : {}) };
    const found = q.slab ? hourlyQuotes(q.slab, q.city, q.pickup) : null;
    summary = { title: found ? slabLabel(found.slab) : "Hourly Rental", chip: "Hourly", when: [q.city, when].filter(Boolean).join(" · ") };
    if (!q.city) errors.push("Please enter the city for your pickup.");
    else if (!found) missing = "Please choose an hourly package.";
    else {
      banner = `Hourly rental · ${found.slab.hours} hrs / ${found.slab.km} km included`;
      quotes = found.quotes;
      tripBase = { kind: "hourly", label: `Hourly Rental · ${slabLabel(found.slab)}`, from: q.city, to: "Back to pickup point", places: [q.city], dropNote: s.dropNote };
    }
  }

  const trip: ReviewTrip | null = tripBase && pickupOk ? reviewTrip(tripBase, q.pickup, when) : null;

  return (
    <ResultsView
      summary={summary}
      box={{ config, initial }}
      errors={errors}
      missing={missing}
      banner={banner}
      daysNote={daysNote}
      quotes={quotes}
      trip={trip}
      preselect={q.service === "outstation" ? q.vehicle : undefined}
    />
  );
}

const POLICY_LABEL = { inclusions: "Inclusions", exclusions: "Exclusions", cab: "Cab details", cancellation: "Cancellation policy", luggage: "Luggage", other: "Other" } as const;

/** Terms and notices for the Review booking screen (default set; location-wise sets come with the admin). */
function reviewTrip(base: { kind: TravellerKind; label: string; from: string; to: string; dropNote?: string }, pickup: When, when: string): ReviewTrip {
  const { settings: s, terms } = getCatalog();
  const at = instant(pickup);
  const cancel = s.freeCancelHours && at ? toWhen(new Date(at.getTime() - s.freeCancelHours * 3_600_000)) : null;
  const cancelLabel = cancel ? whenLabel(cancel, false) : "";
  const policies = (Object.keys(POLICY_LABEL) as (keyof typeof POLICY_LABEL)[])
    .map((id) => {
      const items: [string, string][] = [...terms.sections[id]];
      if (id === "cancellation" && cancel) items.unshift([`Free cancellation till ${s.freeCancelHours} hrs before departure (${cancelLabel})`, "Full refund if you cancel before this time."]);
      return { id, label: POLICY_LABEL[id], items };
    })
    .filter((p) => p.items.length);
  return {
    kind: base.kind,
    label: base.label,
    from: base.from,
    to: base.to,
    when,
    cancelUntil: cancel ? `Free cancellation until ${cancelLabel}` : null,
    freeCancelHours: s.freeCancelHours,
    notices: terms.notices,
    inclusions: terms.sections.inclusions,
    policies,
    partPercent: s.partPercent,
    phone: s.phone,
    ...(s.whatsapp ? { whatsapp: s.whatsapp } : {}),
    ...(base.dropNote ? { dropNote: base.dropNote } : {}),
  };
}
