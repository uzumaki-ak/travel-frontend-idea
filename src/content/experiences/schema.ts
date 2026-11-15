/**
 * Experience data model — the contract between content and UI.
 *
 * Today the data comes from sample JSON files (./data); later the admin
 * dashboard/backend will produce exactly this shape, so the UI never changes.
 * Validated at build time (and later at the API boundary).
 */
import { z } from "zod";

const image = z.object({ src: z.string().min(1), alt: z.string() });

export const FACT_ICONS = ["cancel", "pay-later", "duration", "guide", "pickup", "confirm", "group", "hotel"] as const;

const stop = z.object({
  /** e.g. "09:00" — optional for flexible schedules. */
  time: z.string().optional(),
  title: z.string().min(1),
  kind: z.enum(["start", "visit", "transfer", "meal", "stay", "end"]),
  /** e.g. "1 hour", "30 min". */
  duration: z.string().optional(),
  /** Short tags such as "Guided", "Photo stop", "Entry included". */
  tags: z.array(z.string()).default([]),
  text: z.string().optional(),
  image: image.optional(),
});
export type ItineraryStop = z.infer<typeof stop>;

const day = z.object({ title: z.string().min(1), stops: z.array(stop).min(1) });
export type ItineraryDay = z.infer<typeof day>;

const hotel = z.object({
  place: z.string(),
  name: z.string(),
  stars: z.number().int().min(1).max(5).optional(),
  nights: z.number().int().min(1).optional(),
  image: image.optional(),
});
export type PackageHotel = z.infer<typeof hotel>;

const priceOption = z.object({
  id: z.string().min(1),
  /** e.g. "2 people", "8 – 15 people". */
  label: z.string().min(1),
  /** How many travellers one unit covers (for the summary). */
  guests: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
  /** Price for one unit of this option, in INR. */
  price: z.number().nonnegative(),
  /** Optional "was" price for a discount display. */
  compareAt: z.number().nonnegative().optional(),
});
export type PriceOption = z.infer<typeof priceOption>;

const pkg = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Small ribbon such as "30% off" or "Most popular". */
  tag: z.string().optional(),
  summary: z.string().optional(),
  /** Facts shown on the package details panel, e.g. "Free cancellation (24 hours notice)". */
  chips: z.array(z.string()).default([]),
  /**
   * "group": the visitor sets one traveller count and the option whose guest range
   *   covers it is the price (private car / group brackets).
   * "per-unit": the visitor sets a count per option and the total is the sum (adult/child seats).
   */
  pricingMode: z.enum(["group", "per-unit"]).default("group"),
  priceOptions: z.array(priceOption).min(1),
  itinerary: z.array(day).min(1),
  hotels: z.array(hotel).default([]),
});
export type ExperiencePackage = z.infer<typeof pkg>;

const review = z.object({
  name: z.string().min(1),
  country: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(1),
  /** Which package the reviewer booked (display only). */
  packageName: z.string().optional(),
  reply: z.object({ date: z.string(), text: z.string() }).optional(),
});
export type Review = z.infer<typeof review>;

const link = z.object({ label: z.string().min(1), href: z.string().min(1) });

export const experienceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  seo: z.object({ title: z.string().min(1), description: z.string().min(1) }),
  location: z.object({ name: z.string(), region: z.string(), href: z.string().optional() }),
  categories: z.array(z.string()).default([]),
  /** Ribbon on the title, e.g. "Top rated". */
  badge: z.string().optional(),
  duration: z.object({ type: z.enum(["multi", "day", "hourly"]), label: z.string().min(1) }),
  rating: z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().nonnegative(),
    breakdown: z.array(z.object({ label: z.string(), score: z.number().min(0).max(5) })).default([]),
  }),
  gallery: z.array(image).min(1),
  facts: z.array(z.object({ icon: z.enum(FACT_ICONS), title: z.string(), text: z.string() })).default([]),
  summary: z.string().min(1),
  highlights: z.array(z.string()).default([]),
  description: z.array(z.string()).default([]),
  includes: z.array(z.string()).default([]),
  excludes: z.array(z.string()).default([]),
  notSuitableFor: z.array(z.string()).default([]),
  importantInfo: z.array(z.object({ title: z.string(), items: z.array(z.string()).min(1) })).default([]),
  meetingPoint: z.object({ title: z.string(), text: z.string() }).optional(),
  packages: z.array(pkg).min(1),
  reviews: z.array(review).default([]),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  related: z.array(z.string()).default([]),
  /** SEO link blocks at the bottom ("Things to do in…", "Top destinations", …). */
  tagGroups: z.array(z.object({ title: z.string().min(1), links: z.array(link).min(1) })).default([]),
});
export type Experience = z.infer<typeof experienceSchema>;

/** What listing cards need. */
export type ExperienceCard = Pick<Experience, "slug" | "title" | "location" | "duration" | "rating" | "badge"> & {
  image: Experience["gallery"][number];
  fromPrice: number;
  fromUnit: "per person" | "per group";
  compareAt?: number;
};
