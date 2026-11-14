/**
 * Cab booking contract, shared by the browser (instant feedback) and the API
 * (the real gate). Mirrors the live CF7 form 291: every field required,
 * dropdown values must be one of the live options, phone exactly 10 digits,
 * date from today up to 2 years ahead. Uses zod/mini because it ships to the browser.
 */
import * as z from "zod/mini";

export type CabFormOptions = {
  locations: readonly string[];
  times: readonly string[];
  vehicles: readonly string[];
  countryCodes: readonly string[];
  maxYearsAhead: number;
};

export const CAB_LIMITS = { name: 400, email: 400, phone: 10 } as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

const oneOf = (values: readonly string[], message: string) =>
  z.string().check(z.refine((v: string) => values.includes(v), message));

export function makeCabEnquirySchema(o: CabFormOptions) {
  return z.object({
    submissionId: z.uuid(),
    pickup: oneOf(o.locations, "Choose a pickup location."),
    drop: oneOf(o.locations, "Choose a drop location."),
    date: z.string().check(
      z.regex(ISO_DATE, "Choose your pickup date."),
      z.refine((v: string) => !Number.isNaN(Date.parse(v)), "Choose your pickup date."),
      // A day of slack either side covers visitors whose local date differs from the server's.
      z.refine((v: string) => Date.parse(v) >= Date.now() - 2 * DAY_MS, "Choose a date that hasn't passed."),
      z.refine((v: string) => Date.parse(v) <= Date.now() + (o.maxYearsAhead * 366 + 1) * DAY_MS, "Choose a date within the next 2 years."),
    ),
    time: oneOf(o.times, "Choose a pickup time."),
    name: z
      .string()
      .check(z.trim(), z.minLength(1, "Enter your name."), z.maxLength(CAB_LIMITS.name, "This name is too long.")),
    email: z.pipe(
      z.string().check(z.trim(), z.maxLength(CAB_LIMITS.email, "Enter a valid email address.")),
      z.email("Enter a valid email address."),
    ),
    countryCode: oneOf(o.countryCodes, "Choose a country code."),
    phone: z.string().check(z.trim(), z.regex(/^\d{10}$/, "Enter a 10-digit phone number.")),
    vehicle: oneOf(o.vehicles, "Choose a vehicle type."),
    /** Which cab page the booking came from (for the server's own records only). */
    page: z.optional(z.string().check(z.regex(/^[a-z0-9-]{0,120}$/, "Unknown page."))),
    /** Honeypot: hidden from people, filled by bots. */
    website: z._default(z.string().check(z.maxLength(200)), ""),
  });
}

export type CabEnquiryInput = z.input<ReturnType<typeof makeCabEnquirySchema>>;
export type CabEnquiry = z.output<ReturnType<typeof makeCabEnquirySchema>>;
export type CabField = "pickup" | "drop" | "date" | "time" | "name" | "email" | "countryCode" | "phone" | "vehicle";

export function cabFieldErrors(error: z.core.$ZodError): Partial<Record<CabField, string>> {
  const out: Partial<Record<CabField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as CabField | undefined;
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}
