/**
 * Booking rules and time maths, shared by the browser (to grey out choices) and
 * the server (to refuse them), as in the old plugin. All times are India time;
 * a pickup is a date ("YYYY-MM-DD") plus a time ("HH:mm").
 */
import type { CabSettings, Service } from "@/content/cab-booking/schema";

export type When = { date: string; time: string };

const OFFSET = "+05:30";
const pad = (n: number) => String(n).padStart(2, "0");

/** The instant a pickup means, or null when the date/time is not real. */
export function instant({ date, time }: When): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00${OFFSET}`);
  if (Number.isNaN(d.getTime())) return null;
  // Reject rollovers like 31 Feb.
  return toWhen(d).date === date && toWhen(d).time === time ? d : null;
}

/** India-time date and time of an instant. */
export function toWhen(d: Date): When {
  const ist = new Date(d.getTime() + 330 * 60_000);
  return {
    date: `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`,
    time: `${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}`,
  };
}

export const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
export const timeOf = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

/** The current time (one place to read the clock; the server reads it per request). */
export const clock = () => Date.now();

/** Add days to an ISO date. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Days between two ISO dates (b − a). */
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

/** Earliest bookable instant (now + minimum notice). */
export const earliest = (s: CabSettings, now = Date.now()) => new Date(now + s.minLeadMinutes * 60_000);

/** Last bookable date for a pickup ("return" gets 30 more days). */
export const lastDate = (s: CabSettings, kind: "pickup" | "return" = "pickup", now = Date.now()) =>
  addDays(toWhen(new Date(now)).date, s.maxAdvanceDays + (kind === "return" ? 30 : 0));

/** Tomorrow at the default hour, pushed a day at a time until it respects the notice period. */
export function defaultPickup(s: CabSettings, now = Date.now()): When {
  let at: When = { date: addDays(toWhen(new Date(now)).date, 1), time: timeOf(s.defaultPickupHour * 60) };
  while ((instant(at)?.getTime() ?? 0) < earliest(s, now).getTime()) at = { ...at, date: addDays(at.date, 1) };
  return at;
}

/** The day after the pickup, 6 PM. */
export const defaultReturn = (pickup: When): When => ({ date: addDays(pickup.date, 1), time: "18:00" });

/** Is this time outside the cab service hours (and does that rule apply to the service)? */
export function outsideServiceHours(time: string, service: Service, s: CabSettings): boolean {
  const { start, end, services } = s.serviceHours;
  if (!services.includes(service) || start === end) return false;
  const m = minutesOf(time);
  return start < end ? m < start * 60 || m >= end * 60 : m >= end * 60 && m < start * 60;
}

export function hourLabel(hour: number): string {
  if (hour === 24 || hour === 0) return hour === 24 ? "midnight" : "12:00 AM";
  return `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;
}

export function timeLabel(time: string): string {
  const m = minutesOf(time);
  const h = Math.floor(m / 60);
  return `${h % 12 || 12}:${pad(m % 60)} ${h < 12 ? "AM" : "PM"}`;
}

export const serviceHoursMessage = (s: CabSettings) =>
  `Our cabs run between ${hourLabel(s.serviceHours.start)} and ${hourLabel(s.serviceHours.end)}. For a pickup outside these hours, please call us on ${s.phone}.`;

export function leadLabel(s: CabSettings): string {
  const m = s.minLeadMinutes;
  if (m >= 60 && m % 60 === 0) return `${m / 60} hour${m === 60 ? "" : "s"}`;
  return `${m} minute${m === 1 ? "" : "s"}`;
}

/** Why a pickup cannot be booked online, or null when it can. */
export function pickupProblem(when: When, service: Service, s: CabSettings, now = Date.now()): string | null {
  const at = instant(when);
  if (!at) return "That date and time is not valid.";
  if (at.getTime() < earliest(s, now).getTime()) return `Pickup must be at least ${leadLabel(s)} from now. Please choose a later time.`;
  if (when.date > lastDate(s, "pickup", now)) return `Bookings open ${s.maxAdvanceDays} days in advance.`;
  if (outsideServiceHours(when.time, service, s)) return serviceHoursMessage(s);
  return null;
}

export function returnProblem(pickup: When, ret: When, s: CabSettings, now = Date.now()): string | null {
  const a = instant(pickup);
  const b = instant(ret);
  if (!b) return "That return date and time is not valid.";
  if (a && b.getTime() <= a.getTime() + 3_600_000) return "Return must be after the pickup. Please check the return date and time.";
  if (ret.date > lastDate(s, "return", now)) return "That return date is too far ahead. Please call us.";
  return null;
}

/** Calendar days a round trip spans (same day = 1). */
export const tripDays = (pickup: When, ret: When) => Math.max(1, daysBetween(pickup.date, ret.date) + 1);

/** Amount paid now for a part payment. */
export const partAmount = (fare: number, percent: number) => Math.min(fare, Math.max(1, Math.round((fare * percent) / 100)));

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sat, 29 Nov" (+ year when asked). */
export function dateLabel(date: string, withYear = false): string {
  const d = new Date(`${date}T12:00:00Z`);
  return `${WEEKDAY[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ""}`;
}

export const whenLabel = (w: When, withYear = true) => `${dateLabel(w.date, withYear)}, ${timeLabel(w.time)}`;

/** City names compared loosely (case and spaces). */
export const norm = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
