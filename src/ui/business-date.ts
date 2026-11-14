/**
 * Booking dates follow the business's own calendar (India time), so the date
 * picker in the browser and the validation on the server always agree on what
 * "today" is, whatever the visitor's timezone. Dates are ISO strings
 * (YYYY-MM-DD), which compare correctly as plain strings.
 */
export const BUSINESS_TIME_ZONE = "Asia/Kolkata";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Today's date in India, as YYYY-MM-DD. */
export function businessToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** True only for real calendar dates (rejects e.g. 2027-02-31). */
export function isRealIsoDate(value: string): boolean {
  const m = ISO_DATE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** Adds whole days / years to an ISO date (calendar arithmetic, no timezone involved). */
export function shiftIsoDate(iso: string, { days = 0, years = 0 }: { days?: number; years?: number }): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y + years, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Inclusive bookable range: today + minDays … today + maxYears (India time). */
export function bookableRange(minDaysFromToday: number, maxYearsAhead: number, now: Date = new Date()) {
  const today = businessToday(now);
  return { from: shiftIsoDate(today, { days: minDaysFromToday }), to: shiftIsoDate(today, { years: maxYearsAhead }) };
}

/** Local Date at midnight for an ISO date — what a calendar component works with. */
export function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
