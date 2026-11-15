/** Formatting shared by server and client components of the experience pages. */

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** "₹24,600" — Indian digit grouping. */
export const formatInr = (amount: number) => `₹${inr.format(Math.round(amount))}`;

const monthYear = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "Oct 2026" from "2026-10-28". */
export const formatMonthYear = (iso: string) => monthYear.format(new Date(`${iso}T00:00:00Z`));

/** "Sat, 28 Nov 2026" from "2026-11-28". */
export const formatFullDate = (iso: string) => fullDate.format(new Date(`${iso}T00:00:00Z`));

/** Percentage saved, rounded down so we never overstate a discount. */
export const savingPercent = (price: number, compareAt?: number) =>
  compareAt && compareAt > price ? Math.floor(((compareAt - price) / compareAt) * 100) : 0;

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
