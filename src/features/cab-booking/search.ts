/**
 * A cab search as it travels in the results URL (/cab-search/?…). Shared by the
 * booking box (to build the link) and the results page (to read it back).
 * Parameter names match the old plugin's, so its links keep working.
 */
import type { When } from "./rules";

export const SEARCH_PATH = "/cab-search/";
export const PACKAGES_PATH = "/taxi-packages/";
export const packagePath = (slug: string) => `${PACKAGES_PATH}${slug}/`;

export type OutstationSearch = { service: "outstation"; trip: "oneway" | "round"; from: string; to: string; pickup: When; ret: When | null; vehicle?: string };
export type AirportSearch = { service: "airport"; dir: "from" | "to"; from: string; to: string; pickup: When };
export type HourlySearch = { service: "hourly"; city: string; slab: string; pickup: When };
export type CabSearch = OutstationSearch | AirportSearch | HourlySearch;

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export function searchHref(s: CabSearch): string {
  const p = new URLSearchParams();
  if (s.service !== "outstation") p.set("service", s.service);
  if (s.service === "outstation") {
    p.set("trip", s.trip);
    p.set("from", s.from);
    p.set("to", s.to);
  } else if (s.service === "airport") {
    p.set("dir", s.dir);
    p.set("from", s.from);
    p.set("to", s.to);
  } else {
    p.set("pa", s.city);
    p.set("pkg", s.slab);
  }
  p.set("pd", s.pickup.date);
  p.set("pt", s.pickup.time);
  if (s.service === "outstation" && s.trip === "round" && s.ret) {
    p.set("rd", s.ret.date);
    p.set("rt", s.ret.time);
  }
  if (s.service === "outstation" && s.vehicle) p.set("v", s.vehicle);
  return `${SEARCH_PATH}?${p.toString()}`;
}

/** Read a search back from the URL. Missing pieces come back empty; the page decides what to do. */
export function parseSearch(params: Params): CabSearch {
  const pickup = { date: one(params.pd), time: one(params.pt) };
  const service = one(params.service);
  if (service === "airport") return { service, dir: one(params.dir) === "to" ? "to" : "from", from: one(params.from), to: one(params.to), pickup };
  if (service === "hourly") return { service, city: one(params.pa), slab: one(params.pkg), pickup };
  const round = one(params.trip) === "round";
  const ret = round && one(params.rd) ? { date: one(params.rd), time: one(params.rt) } : null;
  return { service: "outstation", trip: round ? "round" : "oneway", from: one(params.from), to: one(params.to), pickup, ret, vehicle: one(params.v) || undefined };
}

/** A one-way search for a route with no date yet (the results page starts from the default pickup). */
export const routeSearchHref = (from: string, to: string, vehicle?: string) =>
  `${SEARCH_PATH}?${new URLSearchParams({ trip: "oneway", from, to, ...(vehicle ? { v: vehicle } : {}) }).toString()}`;

export function packagesHref(loc: string, days: number | null): string {
  const p = new URLSearchParams();
  if (loc) p.set("loc", loc);
  if (days) p.set("days", String(days));
  const q = p.toString();
  return q ? `${PACKAGES_PATH}?${q}` : PACKAGES_PATH;
}
