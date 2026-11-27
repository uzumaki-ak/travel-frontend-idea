/**
 * Cab booking catalogue: cab types, outstation routes, airport transfers, hourly
 * slabs, sightseeing packages, service areas, terms and settings. Mirrors what
 * the old WordPress plugin managed; later the admin dashboard edits the same shape.
 */
import { z } from "zod";

export const SERVICES = ["outstation", "sightseeing", "airport", "hourly"] as const;
export type Service = (typeof SERVICES)[number];

const vehicle = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** What customers see, e.g. "Dzire / Similar". */
  name: z.string().min(1),
  category: z.string(),
  seats: z.number().int().positive(),
  ac: z.boolean(),
  /** ₹ per km beyond the included km. */
  extraKm: z.number().nonnegative(),
  /** ₹ per hour beyond an hourly package. */
  extraHour: z.number().nonnegative(),
  /** ₹ per hour of waiting (outstation). */
  waiting: z.number().nonnegative(),
  /** Default charge for each extra day a round-trip cab stays. */
  perExtraDay: z.number().nonnegative(),
  /** Which outline we draw until real cab photos exist. */
  shape: z.enum(["hatch", "sedan", "suv", "van"]),
  image: z.string().optional(),
  order: z.number().int(),
});
export type Vehicle = z.infer<typeof vehicle>;

const route = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  from: z.string().min(1),
  to: z.string().min(1),
  distanceKm: z.number().nonnegative(),
  duration: z.string(),
  /** Per cab: one-way fare and same-day round-trip fare (absent = one way only). */
  fares: z.array(z.object({ vehicle: z.string(), oneWay: z.number().int().positive(), round: z.number().int().positive().optional(), perExtraDay: z.number().int().optional() })),
  /** Its existing /cars/<page>/ article, if any. */
  page: z.string().optional(),
});
export type Route = z.infer<typeof route>;

const transfer = z.object({
  id: z.string(),
  airport: z.string().min(1),
  area: z.string().min(1),
  distanceKm: z.number().nonnegative(),
  duration: z.string(),
  /** Per cab: fare for pickup from the airport and for drop to it (absent = not offered). */
  fares: z.array(z.object({ vehicle: z.string(), pickup: z.number().int().positive().optional(), drop: z.number().int().positive().optional() })),
});
export type Transfer = z.infer<typeof transfer>;

const hourly = z.object({
  id: z.string(),
  hours: z.number().int().positive(),
  km: z.number().int().nonnegative(),
  fares: z.array(z.object({ vehicle: z.string(), fare: z.number().int().positive() })),
});
export type HourlySlab = z.infer<typeof hourly>;

const pkg = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  excerpt: z.string(),
  about: z.array(z.string()),
  days: z.number().int().positive(),
  nights: z.number().int().nonnegative(),
  start: z.string(),
  end: z.string(),
  places: z.array(z.string()),
  locations: z.array(z.string()).min(1),
  cover: z.string(),
  gallery: z.array(z.string()),
  itinerary: z.array(z.object({ title: z.string(), text: z.string() })),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
  /** Price per cab for the whole trip. */
  prices: z.array(z.object({ vehicle: z.string(), price: z.number().int().positive() })),
});
export type TaxiPackage = z.infer<typeof pkg>;

const item = z.tuple([z.string(), z.string()]);
export const POLICY_TABS = ["inclusions", "exclusions", "cab", "cancellation", "luggage", "other"] as const;
export type PolicyTab = (typeof POLICY_TABS)[number];

export const catalogSchema = z
  .object({
    settings: z.object({
      phone: z.string(),
      whatsapp: z.string().optional(),
      partPercent: z.number().int().min(1).max(100),
      packagePartPercent: z.number().int().min(1).max(100),
      holdMinutes: z.number().int().positive(),
      minLeadMinutes: z.number().int().nonnegative(),
      maxAdvanceDays: z.number().int().positive(),
      /** Pickups allowed online between start and end (24h clock) for the listed services. */
      serviceHours: z.object({ start: z.number().int().min(0).max(24), end: z.number().int().min(0).max(24), services: z.array(z.enum(SERVICES)) }),
      defaultPickupHour: z.number().int().min(0).max(23),
      freeCancelHours: z.number().int().nonnegative(),
      airportFreeWait: z.number().int().nonnegative(),
      hourlyCities: z.array(z.string()),
      dropNote: z.string(),
    }),
    vehicles: z.array(vehicle).min(1),
    routes: z.array(route),
    transfers: z.array(transfer),
    hourly: z.array(hourly),
    locations: z.array(z.object({ id: z.string(), name: z.string() })),
    packages: z.array(pkg),
    areas: z.array(z.object({ name: z.string(), cities: z.array(z.string()), stock: z.record(z.string(), z.number().int().nonnegative()) })),
    /** How the booking box opens on a /cars/<slug>/ page that is not an outstation route (airport, hourly…). */
    pagePrefill: z
      .record(
        z.string(),
        z.object({ tab: z.enum(SERVICES), dir: z.enum(["from", "to"]).optional(), from: z.string().optional(), to: z.string().optional(), city: z.string().optional() }),
      )
      .default({}),
    terms: z.object({
      notices: z.array(z.string()),
      sections: z.object({
        inclusions: z.array(item),
        exclusions: z.array(item),
        cab: z.array(item),
        cancellation: z.array(item),
        luggage: z.array(item),
        other: z.array(item),
      }),
    }),
  })
  .superRefine((d, ctx) => {
    const ids = new Set(d.vehicles.map((v) => v.id));
    const check = (v: string, where: string) => {
      if (!ids.has(v)) ctx.addIssue({ code: "custom", message: `${where} uses unknown cab "${v}"` });
    };
    d.routes.forEach((r) => r.fares.forEach((f) => check(f.vehicle, `Route ${r.id}`)));
    d.transfers.forEach((t) => t.fares.forEach((f) => check(f.vehicle, `Transfer ${t.id}`)));
    d.hourly.forEach((h) => h.fares.forEach((f) => check(f.vehicle, `Hourly ${h.id}`)));
    d.packages.forEach((p) => p.prices.forEach((f) => check(f.vehicle, `Package ${p.slug}`)));
    const locs = new Set(d.locations.map((l) => l.id));
    d.packages.forEach((p) => p.locations.forEach((l) => locs.has(l) || ctx.addIssue({ code: "custom", message: `Package ${p.slug} uses unknown location "${l}"` })));
  });
export type CabCatalog = z.infer<typeof catalogSchema>;
export type CabSettings = CabCatalog["settings"];
