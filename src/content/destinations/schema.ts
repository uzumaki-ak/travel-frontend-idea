import { z } from "zod";
import cabIndex from "../cabs/index.json";
import { experienceSlugs } from "../experiences/slugs";

const image = z.object({ src: z.string().min(1), alt: z.string() });
const knownExperiences = new Set<string>(experienceSlugs);
const knownCabs = new Set<string>(cabIndex.slugs);

/** A theme chip ("Waterfalls", "Honeymoon", …). Tours, experiences, attractions and cabs each have their own list. */
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
  /** Tour themes (ids from `categories`). */
  categories: z.array(z.string()).min(1),
  /** Experience themes for day outings (ids from `experienceThemes`). */
  experienceThemes: z.array(z.string()).default([]),
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
  /** Tour themes it belongs to (ids from the hub's `categories`; the tour page filter uses these). */
  categories: z.array(z.string()).default([]),
  /** Attraction themes (ids from `attractionThemes`; the destination page uses these). */
  themes: z.array(z.string()).default([]),
});

/**
 * A cab route listed on the hub. It opens the real /cars/<slug>/ page; the title
 * comes from that page. `fare` is the starting fare that page publishes.
 */
const hubCab = z.object({
  slug: z.string().refine((s) => knownCabs.has(s), { message: "Unknown cab page" }),
  image,
  fare: z.number().int().positive().optional(),
  /** Cab themes (ids from `cabThemes`). */
  themes: z.array(z.string()).default([]),
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
    /** Tour themes. */
    categories: z.array(category).min(1),
    experienceThemes: z.array(category).default([]),
    attractionThemes: z.array(category).default([]),
    cabThemes: z.array(category).default([]),
    listings: z.array(listing).min(1),
    /** Shown inside the tour grid, after the first row ("content in between"). */
    interlude: z.object({ title: z.string(), text: z.string(), cta: z.string() }),
    attractions: z.array(attraction).default([]),
    cabs: z.array(hubCab).default([]),
    reviews: z.array(hubReview).default([]),
    info: travelInfo.optional(),
    /** Travel guide / blog posts. */
    guides: z.array(z.object({ title: z.string().min(1), tag: z.string(), minutes: z.number().int().positive(), image, excerpt: z.string().optional() })).default([]),
    /** The big "must-visit" line; words in [brackets] are set in an outlined pill. */
    statement: z.string().optional(),
    /** At-a-glance facts beside the destination title ("Best time", "Nearest airport", …). */
    quickFacts: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).default([]),
    /** "Good to know": tips and facts, each led by a big figure or phrase. */
    facts: z.array(z.object({ value: z.string().min(1), label: z.string().min(1), text: z.string().min(1) })).default([]),
    faqs: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).default([]),
    /** "Couldn't find what you're looking for?" card next to the FAQ. */
    callback: z.object({ title: z.string(), text: z.string(), cta: z.string() }).optional(),
    nearby: z.array(z.object({ name: z.string().min(1), text: z.string(), image, href: z.string().min(1) })).default([]),
    why: z.array(z.object({ title: z.string().min(1), text: z.string().min(1) })).default([]),
    /** SEO link blocks at the bottom; titles and links are written per hub. */
    tagGroups: z.array(z.object({ title: z.string().min(1), links: z.array(link).min(1) })).default([]),
  })
  .superRefine((d, ctx) => {
    const check = (list: { id: string }[], used: string[], who: string) => {
      const ids = new Set(list.map((c) => c.id));
      for (const c of used) if (!ids.has(c)) ctx.addIssue({ code: "custom", message: `${who} uses unknown theme "${c}"` });
    };
    for (const l of d.listings) {
      check(d.categories, l.categories, `Listing "${l.id}"`);
      check(d.experienceThemes, l.experienceThemes, `Listing "${l.id}"`);
    }
    for (const a of d.attractions) {
      check(d.categories, a.categories, `Attraction "${a.name}"`);
      check(d.attractionThemes, a.themes, `Attraction "${a.name}"`);
    }
    for (const c of d.cabs) check(d.cabThemes, c.themes, `Cab "${c.slug}"`);
    if (new Set(d.listings.map((l) => l.id)).size !== d.listings.length) {
      ctx.addIssue({ code: "custom", message: "Listing ids must be unique" });
    }
  });
export type Destination = z.infer<typeof destinationSchema>;
export type DestinationAttraction = Destination["attractions"][number];

/** A cab as the hub shows it, with the title read from the cab page. */
export type HubCabCard = { slug: string; title: string; href: string; image: { src: string; alt: string }; fare?: number; themes: string[] };
