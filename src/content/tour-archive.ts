/**
 * Typed access to the tour listing snapshot (`scripts/sync-tour-archive.mjs`).
 * Card text is a verbatim copy of the live listing; validated at build time.
 */
import "server-only";
import { z } from "zod";
import data from "./tour-archive.json";

const cardSchema = z.object({
  title: z.string().min(1),
  href: z.string().regex(/^\/tours\/[a-z0-9-]+\/$/),
  image: z.string().nullable(),
  duration: z.string(),
  price: z.object({ label: z.string(), amount: z.string(), unit: z.string() }).optional(),
  includes: z.array(z.string()),
  queryLabel: z.string(),
  detailsLabel: z.string(),
});
export type ArchiveCard = z.infer<typeof cardSchema>;

const archiveSchema = z.object({
  seo: z.object({ title: z.string().min(1), description: z.string(), canonical: z.string() }),
  heading: z.string().min(1),
  loadMoreLabel: z.string().min(1),
  perPage: z.number().int().positive(),
  /** The live site answers /tours/page/2/ … /tours/page/<lastPagedUrl>/ (all repeating page 1). */
  lastPagedUrl: z.number().int().min(1),
  cards: z.array(cardSchema).min(1),
});

export const tourArchive = archiveSchema.parse(data);

/** Page numbers served at /tours/page/<n>/, matching the live site. */
export const archivePageNumbers: number[] = Array.from({ length: tourArchive.lastPagedUrl - 1 }, (_, i) => i + 2);
