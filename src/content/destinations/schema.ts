import { z } from "zod";
import cabIndex from "../cabs/index.json";
import { experienceSlugs } from "../experiences/slugs";

const image = z.object({ src: z.string().min(1), alt: z.string() });
const knownExperiences = new Set<string>(experienceSlugs);
const knownCabs = new Set<string>(cabIndex.slugs);

/** A filter chip on the hub ("Waterfalls", "Honeymoon", …). */
const category = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
});

/**
 * One tour as listed on a hub. Every listing opens a real experience page
 * (`experience`), so a card never leads to a 404. Until each tour has its own
 * page, several listings may share one.
 */
const listing = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  experience: z.string().refine((s) => knownExperiences.has(s), { message: "Unknown experience slug" }),
  /** First photo is the cover; the rest are the card's mini gallery. */
  images: z.array(image).min(1),
  days: z.number().int().min(1),
  durationLabel: z.string().min(1),
  /** Places covered, in order ("Shillong", "Cherrapunji", …). */
  route: z.array(z.string()).default([]),
  rating: z.object({ average: z.number().min(0).max(5), count: z.number().int().nonnegative() }),
  price: z.object({
    from: z.number().int().positive(),
    compareAt: z.number().int().positive().optional(),
    unit: z.enum(["per person", "per group"]),
  }),
  categories: z.array(z.string()).min(1),
  badge: z.string().optional(),
  /** Display order: lower comes first. This is the "which tour shows first" control. */
  rank: z.number().int(),
  popular: z.boolean().default(false),
});
export type DestinationListing = z.infer<typeof listing>;

const attraction = z.object({
  name: z.string().min(1),
  place: z.string(),
  text: z.string().min(1),
  image,
  /** Route stops that reach it; "show tours that visit it" matches these against each tour's route. */
  stops: z.array(z.string()).min(1),
  /** Themes it belongs to (same ids as the hub's categories). */
  categories: z.array(z.string()).default([]),
});

/**
 * A cab route listed on the hub. It opens the real /cars/<slug>/ page; the title
 * comes from that page. `fare` is the starting fare that page publishes.
 */
const hubCab = z.object({
  slug: z.string().refine((s) => knownCabs.has(s), { message: "Unknown cab page" }),
  image,
  fare: z.number().int().positive().optional(),
});

const hubReview = z.object({
  name: z.string().min(1),
  from: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rating: z.number().int().min(1).max(5),
  /** Which tour they took (display only). */
  tour: z.string(),
  text: z.string().min(1),
});

const travelInfo = z.object({
  bestTime: z.object({
    summary: z.string().min(1),
    seasons: z.array(z.object({ name: z.string(), months: z.string(), text: z.string(), verdict: z.enum(["best", "good", "wet"]) })).min(1),
  }),
  reach: z.array(z.object({ mode: z.enum(["air", "rail", "road"]), title: z.string(), text: z.string() })).min(1),
  weather: z.object({
    note: z.string(),
    /** Twelve months, January first. Temperatures in °C, rain in mm. */
    months: z.array(z.object({ month: z.string(), high: z.number(), low: z.number(), rain: z.number().nonnegative() })).length(12),
  }),
});

const link = z.object({ label: z.string().min(1), href: z.string().min(1) });

export const destinationSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    seo: z.object({ title: z.string().min(1), description: z.string().min(1) }),
    hero: z.object({
      tagline: z.string().min(1),
      /** Intro copy; the first paragraph shows in full, the rest sit behind "Read more". */
      intro: z.array(z.string()).min(1),
      /** The hero slideshow. `place` is the caption ("Umngot River · Dawki"). */
      images: z.array(image.extend({ place: z.string().optional() })).min(3),
      /** Optional background film (muted, looping). The photos remain the fallback. */
      video: z.object({ src: z.string().min(1), poster: z.string().min(1) }).optional(),
    }),
    categories: z.array(category).min(1),
    listings: z.array(listing).min(1),
    /** Shown inside the tour grid, after the first row ("content in between"). */
    interlude: z.object({ title: z.string(), text: z.string(), cta: z.string() }),
    attractions: z.array(attraction).default([]),
    cabs: z.array(hubCab).default([]),
    reviews: z.array(hubReview).default([]),
    info: travelInfo.optional(),
    guides: z.array(z.object({ title: z.string().min(1), tag: z.string(), minutes: z.number().int().positive(), image })).default([]),
    faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).default([]),
    /** "Couldn't find what you're looking for?" card next to the FAQ. */
    callback: z.object({ title: z.string(), text: z.string(), cta: z.string() }).optional(),
    nearby: z.array(z.object({ name: z.string().min(1), text: z.string(), image, href: z.string().min(1) })).default([]),
    why: z.array(z.object({ title: z.string().min(1), text: z.string().min(1) })).default([]),
    /** SEO link blocks at the bottom; titles and links are written per hub. */
    tagGroups: z.array(z.object({ title: z.string().min(1), links: z.array(link).min(1) })).default([]),
  })
  .superRefine((d, ctx) => {
    const ids = new Set(d.categories.map((c) => c.id));
    for (const l of d.listings) {
      for (const c of l.categories) {
        if (!ids.has(c)) ctx.addIssue({ code: "custom", message: `Listing "${l.id}" uses unknown category "${c}"` });
      }
    }
    for (const a of d.attractions) {
      for (const c of a.categories) {
        if (!ids.has(c)) ctx.addIssue({ code: "custom", message: `Attraction "${a.name}" uses unknown category "${c}"` });
      }
    }
    if (new Set(d.listings.map((l) => l.id)).size !== d.listings.length) {
      ctx.addIssue({ code: "custom", message: "Listing ids must be unique" });
    }
  });
export type Destination = z.infer<typeof destinationSchema>;
export type DestinationAttraction = Destination["attractions"][number];

/** A cab as the hub shows it, with the title read from the cab page. */
export type HubCabCard = { slug: string; title: string; href: string; image: { src: string; alt: string }; fare?: number };
