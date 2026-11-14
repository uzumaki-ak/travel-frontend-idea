/**
 * The enquiry contract, shared by the browser (instant feedback) and the API
 * route (the real gate). Limits mirror the original Contact Form 7 form:
 * name ≤ 40, phone 10–15, query ≤ 300.
 *
 * Uses `zod/mini` (tree-shakeable) because this file ships to the browser.
 */
import * as z from "zod/mini";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ONE_DAY_MS = 86_400_000;

export const ENQUIRY_LIMITS = { name: 40, email: 400, phone: 15, message: 300, travellers: 99 } as const;

const travellerCount = (min: number, minMessage: string) =>
  z.coerce.number("Enter a number.").check(
    z.refine(Number.isInteger, "Enter a whole number."),
    z.minimum(min, minMessage),
    z.maximum(ENQUIRY_LIMITS.travellers, `Enter ${ENQUIRY_LIMITS.travellers} or fewer.`),
  );

export const enquirySchema = z.object({
  submissionId: z.uuid(),
  name: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, "Enter your name."),
      z.maxLength(ENQUIRY_LIMITS.name, `Keep your name under ${ENQUIRY_LIMITS.name} characters.`),
    ),
  email: z.pipe(
    z.string().check(z.trim(), z.maxLength(ENQUIRY_LIMITS.email, "Enter a valid email address.")),
    z.email("Enter a valid email address."),
  ),
  phone: z.string().check(
    z.trim(),
    z.regex(/^[+\d][\d\s()-]*$/, "Use digits only, with an optional + at the start."),
    z.refine((v: string) => {
      const digits = v.replace(/\D/g, "").length;
      return digits >= 10 && digits <= ENQUIRY_LIMITS.phone;
    }, "Enter a phone number with 10 to 15 digits."),
  ),
  travelDate: z.string().check(
    z.regex(ISO_DATE, "Choose your date of travel."),
    z.refine((v: string) => !Number.isNaN(Date.parse(v)), "Choose your date of travel."),
    // Slack covers visitors whose local date is ahead of the server's.
    z.refine((v: string) => Date.parse(v) >= Date.now() - 2 * ONE_DAY_MS, "Choose a date that hasn't passed."),
  ),
  adults: travellerCount(1, "At least 1 adult is needed."),
  children: z.pipe(
    z.union([z.literal(""), travellerCount(0, "Enter 0 or more.")]),
    z.transform((v: "" | number) => (v === "" ? 0 : v)),
  ),
  message: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, "Tell us what you'd like to book."),
      z.maxLength(ENQUIRY_LIMITS.message, `Keep your query under ${ENQUIRY_LIMITS.message} characters.`),
    ),
  /** Which tour page the enquiry came from. The server looks it up; unknown slugs are ignored. */
  tourSlug: z.optional(z.string().check(z.regex(/^[a-z0-9-]{1,150}$/, "Unknown tour."))),
  /** Honeypot: hidden from people, filled by bots. */
  website: z._default(z.string().check(z.maxLength(200)), ""),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;
export type EnquiryField = Exclude<keyof Enquiry, "submissionId" | "website" | "tourSlug">;

/** One response shape for every outcome, so the UI never parses provider errors. */
export type EnquiryResponse =
  | { ok: true; message: string }
  | {
      ok: false;
      error: {
        code: "VALIDATION_ERROR" | "RATE_LIMITED" | "NOT_CONFIGURED" | "UPSTREAM_REJECTED" | "UPSTREAM_UNAVAILABLE" | "OUTCOME_UNKNOWN";
        message: string;
        /** Field name → message. Each form maps these onto its own fields. */
        fields?: Record<string, string>;
      };
    };

/** Maps validation issues to one message per field (the first one wins). */
export function fieldErrors(error: z.core.$ZodError): Partial<Record<EnquiryField, string>> {
  const out: Partial<Record<EnquiryField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as EnquiryField | undefined;
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}
