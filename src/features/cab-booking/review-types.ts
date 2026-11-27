/**
 * What the results page hands the Review booking screen. Worked out on the
 * server (fares, terms), plain data so it crosses to the browser.
 */
import type { CabQuote } from "@/content/cab-booking";

export type { CabQuote };

export type PolicyPanel = { id: string; label: string; items: [string, string][] };

/** Which traveller fields the trip needs. */
export type TravellerKind = "outstation" | "airport-pickup" | "airport-drop" | "hourly";

export type ReviewTrip = {
  kind: TravellerKind;
  /** "Outstation One Way Trip", "Airport Pickup", "Hourly Rental · 4 Hrs 40 Km". */
  label: string;
  from: string;
  to: string;
  when: string;
  /** "Free cancellation until 28 Nov, 9:00 AM" (absent = no free period). */
  cancelUntil: string | null;
  freeCancelHours: number;
  notices: string[];
  /** First few inclusions shown on the screen; the rest live in the policies sheet. */
  inclusions: [string, string][];
  policies: PolicyPanel[];
  partPercent: number;
  phone: string;
  whatsapp?: string;
  dropNote?: string;
};
