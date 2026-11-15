/**
 * Price maths for a package selection — pure functions, shared by the picker
 * and (later) the server that turns a selection into a booking.
 */
import type { ExperiencePackage, PriceOption } from "@/content/experiences/schema";

export type Selection =
  | { mode: "group"; travellers: number }
  | { mode: "per-unit"; counts: Record<string, number> };

export type Quote = {
  travellers: number;
  /** null when no option covers the chosen group size (ask for a quote). */
  total: number | null;
  compareAt: number | null;
  lines: { label: string; qty: number; amount: number }[];
};

export const PER_UNIT_MAX = 15;

export function groupRange(pkg: ExperiencePackage) {
  return {
    min: Math.min(...pkg.priceOptions.map((o) => o.guests.min)),
    max: Math.max(...pkg.priceOptions.map((o) => o.guests.max)),
  };
}

export const optionFor = (pkg: ExperiencePackage, travellers: number): PriceOption | undefined =>
  pkg.priceOptions.find((o) => travellers >= o.guests.min && travellers <= o.guests.max);

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** A sensible starting selection for a package, keeping the traveller count when possible. */
export function initialSelection(pkg: ExperiencePackage, previousTravellers = 2): Selection {
  if (pkg.pricingMode === "per-unit") {
    const [first] = pkg.priceOptions;
    return { mode: "per-unit", counts: first ? { [first.id]: clamp(previousTravellers, 1, PER_UNIT_MAX) } : {} };
  }
  const { min, max } = groupRange(pkg);
  return { mode: "group", travellers: clamp(previousTravellers, min, max) };
}

export function quote(pkg: ExperiencePackage, selection: Selection): Quote {
  if (selection.mode === "group") {
    const option = optionFor(pkg, selection.travellers);
    if (!option) return { travellers: selection.travellers, total: null, compareAt: null, lines: [] };
    return {
      travellers: selection.travellers,
      total: option.price,
      compareAt: option.compareAt && option.compareAt > option.price ? option.compareAt : null,
      lines: [{ label: `Group rate · ${option.label}`, qty: 1, amount: option.price }],
    };
  }

  const lines = pkg.priceOptions
    .map((o) => ({ option: o, qty: selection.counts[o.id] ?? 0 }))
    .filter((l) => l.qty > 0);
  const total = lines.reduce((sum, l) => sum + l.qty * l.option.price, 0);
  const compare = lines.reduce((sum, l) => sum + l.qty * (l.option.compareAt ?? l.option.price), 0);
  return {
    travellers: lines.reduce((sum, l) => sum + l.qty * l.option.guests.min, 0),
    total: lines.length ? total : null,
    compareAt: compare > total ? compare : null,
    lines: lines.map((l) => ({ label: l.option.label, qty: l.qty, amount: l.qty * l.option.price })),
  };
}
