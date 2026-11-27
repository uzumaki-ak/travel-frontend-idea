/**
 * Content provider for cab booking. Pages talk only to these functions, so the
 * sample JSON can later be swapped for the database without touching the UI.
 * Every fare is worked out here on the server, never taken from the browser.
 */
import "server-only";
import { norm, partAmount, tripDays, type When } from "@/features/cab-booking/rules";
import data from "./data.json";
import { catalogSchema, type CabCatalog, type Route, type TaxiPackage, type Vehicle } from "./schema";

const catalog: CabCatalog = catalogSchema.parse(data);

export const getCatalog = () => catalog;
export const cabSettings = () => catalog.settings;

const vehicleById = new Map(catalog.vehicles.map((v) => [v.id, v]));
const byOrder = (a: { vehicle: Vehicle }, b: { vehicle: Vehicle }) => a.vehicle.order - b.vehicle.order;

/** One priced cab in a results list (and on the review screen). */
export type CabQuote = {
  vehicle: Vehicle;
  fare: number;
  /** Paid now on a part payment. */
  part: number;
  soldOut: boolean;
  /** Km included (0 = not stated). */
  km: number;
  /** Hourly packages: hours included. */
  hours?: number;
  /** "₹4,500 + 2 extra days × ₹2,000". */
  note?: string;
  /** Same-day round-trip fare, shown beside the one-way fare on route pages. */
  alt?: number;
  /** Airport pickups: free waiting after landing, in minutes. */
  wait?: number;
};

/* ------------------------------------------------------------------ Stock */

/** The service area a place belongs to (exact name, or the city as a whole word inside it). */
function areaOf(place: string) {
  const p = norm(place);
  return catalog.areas.find((a) => a.cities.some((c) => norm(c) === p || new RegExp(`(^|[^a-z0-9])${norm(c).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(p)));
}

/** Cabs of a type still free on a date in the pickup's area. No bookings are stored yet, so this is the area's stock. */
function available(vehicle: string, _date: string, pickupPlace: string): number {
  const area = areaOf(pickupPlace);
  if (!area) return Number.POSITIVE_INFINITY; // Places in no area are not limited.
  return area.stock[vehicle] ?? 0;
}

const quote = (vehicleId: string, fare: number, date: string, place: string, extra: Partial<CabQuote> = {}): CabQuote | null => {
  const vehicle = vehicleById.get(vehicleId);
  if (!vehicle) return null;
  return { vehicle, fare, part: partAmount(fare, catalog.settings.partPercent), soldOut: date ? available(vehicleId, date, place) < 1 : false, km: 0, ...extra };
};
const sorted = (q: (CabQuote | null)[]) => (q.filter(Boolean) as CabQuote[]).sort(byOrder);

/* ------------------------------------------------------------- Outstation */

export const findRoute = (from: string, to: string) => catalog.routes.find((r) => norm(r.from) === norm(from) && norm(r.to) === norm(to)) ?? null;
export const routeByPage = (page: string) => catalog.routes.find((r) => r.page === page) ?? null;

export const kmIncluded = (r: Route, trip: "oneway" | "round") => (trip === "round" ? r.distanceKm * 2 : r.distanceKm);

export function outstationQuotes(r: Route, q: { trip: "oneway" | "round"; pickup: When; ret?: When | null }): CabQuote[] {
  const date = q.pickup.date;
  if (q.trip === "round") {
    const days = q.ret ? tripDays(q.pickup, q.ret) : 1;
    return sorted(
      r.fares.map((f) => {
        if (!f.round) return null;
        const v = vehicleById.get(f.vehicle);
        const per = f.perExtraDay ?? v?.perExtraDay ?? 0;
        const extra = Math.max(0, days - 1);
        const fare = f.round + extra * per;
        return quote(f.vehicle, fare, date, r.from, {
          km: kmIncluded(r, "round"),
          ...(extra && per ? { note: `₹${f.round.toLocaleString("en-IN")} + ${extra} extra day${extra > 1 ? "s" : ""} × ₹${per.toLocaleString("en-IN")}` } : {}),
        });
      }),
    );
  }
  return sorted(r.fares.map((f) => quote(f.vehicle, f.oneWay, date, r.from, { km: kmIncluded(r, "oneway") })));
}

/** Route pages: one-way fares with the same-day round trip beside them, no date (so no stock). */
export const routeCard = (r: Route): CabQuote[] =>
  sorted(r.fares.map((f) => quote(f.vehicle, f.oneWay, "", r.from, { km: kmIncluded(r, "oneway"), ...(f.round ? { alt: f.round } : {}) })));

/* ---------------------------------------------------------------- Airport */

export const findTransfer = (airport: string, area: string) =>
  catalog.transfers.find((t) => norm(t.airport) === norm(airport) && norm(t.area) === norm(area)) ?? null;

export function airportQuotes(dir: "from" | "to", from: string, to: string, pickup: When) {
  const airport = dir === "from" ? from : to;
  const area = dir === "from" ? to : from;
  const t = findTransfer(airport, area);
  if (!t) return null;
  const quotes = sorted(
    t.fares.map((f) => {
      const fare = dir === "from" ? f.pickup : f.drop;
      return fare ? quote(f.vehicle, fare, pickup.date, from, { km: t.distanceKm, ...(dir === "from" ? { wait: catalog.settings.airportFreeWait } : {}) }) : null;
    }),
  );
  return { transfer: t, quotes };
}

/* ----------------------------------------------------------------- Hourly */

export const hourlySlab = (id: string) => catalog.hourly.find((h) => h.id === id) ?? null;
export const slabLabel = (h: { hours: number; km: number }) => `${h.hours} Hrs ${h.km} Km`;

export function hourlyQuotes(slabId: string, city: string, pickup: When) {
  const slab = hourlySlab(slabId);
  if (!slab) return null;
  return { slab, quotes: sorted(slab.fares.map((f) => quote(f.vehicle, f.fare, pickup.date, city, { km: slab.km, hours: slab.hours }))) };
}

/* -------------------------------------------------------------- Packages */

export const packageBySlug = (slug: string) => catalog.packages.find((p) => p.slug === slug) ?? null;
export const packageSlugs = () => catalog.packages.map((p) => p.slug);
export const locationName = (id: string) => catalog.locations.find((l) => l.id === id)?.name ?? id;

/** Locations that have at least one package, in catalogue order. */
export const packageLocations = () => catalog.locations.filter((l) => catalog.packages.some((p) => p.locations.includes(l.id)));

/** Cab options for a package, cheapest first, with the part-payment amount. */
export function packageOptions(p: TaxiPackage) {
  return p.prices
    .map((o) => ({ vehicle: vehicleById.get(o.vehicle)!, price: o.price, part: partAmount(o.price, catalog.settings.packagePartPercent) }))
    .filter((o) => o.vehicle)
    .sort((a, b) => a.price - b.price);
}

export const packageFrom = (p: TaxiPackage) => Math.min(...p.prices.map((o) => o.price));

/* ------------------------------------------------------------ Cab pages */

/** How a /cars/<slug>/ page opens the booking box: its route, or its airport / hourly setting. */
export function cabPageBooking(slug: string) {
  const route = slug ? routeByPage(slug) : null;
  if (route) return { initial: { tab: "outstation" as const, from: route.from, to: route.to }, route };
  const pre = slug ? catalog.pagePrefill[slug] : undefined;
  if (!pre) return { initial: {}, route: null };
  const direct = pre.tab === "outstation" && pre.from && pre.to ? findRoute(pre.from, pre.to) : null;
  return { initial: pre, route: direct };
}

/* ------------------------------------------------------- The booking box */

/** Everything the booking box needs in the browser: suggestions, packages, rules. */
export function boxConfig() {
  const s = catalog.settings;
  return {
    settings: s,
    outstation: {
      cities: [...new Set(catalog.routes.flatMap((r) => [r.from, r.to]))],
      pairs: catalog.routes.map((r) => [r.from, r.to] as [string, string]),
    },
    airport: {
      airports: [...new Set(catalog.transfers.map((t) => t.airport))],
      areas: [...new Set(catalog.transfers.map((t) => t.area))],
      pairs: catalog.transfers.map((t) => [t.airport, t.area] as [string, string]),
    },
    hourly: {
      cities: s.hourlyCities,
      slabs: [...catalog.hourly].sort((a, b) => a.hours - b.hours).map((h) => ({ id: h.id, label: slabLabel(h) })),
    },
    sightseeing: {
      locations: packageLocations().map((l) => ({
        id: l.id,
        name: l.name,
        durations: [...new Set(catalog.packages.filter((p) => p.locations.includes(l.id)).map((p) => p.days))].sort((a, b) => a - b),
      })),
      durations: [...new Set(catalog.packages.map((p) => p.days))].sort((a, b) => a - b),
    },
  };
}
export type BoxConfig = ReturnType<typeof boxConfig>;
