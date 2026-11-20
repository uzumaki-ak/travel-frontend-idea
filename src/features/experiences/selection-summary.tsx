"use client";

/**
 * Top of the enquiry popup: what the visitor is asking about. The picked
 * package with its total, or (nothing picked yet) the experience and its
 * lowest price.
 */
import type { FromPrice } from "@/content/experiences";
import { formatInr } from "./format";
import { usePackageSelection } from "./selection-store";

export function SelectionSummary({ experienceTitle, from }: { experienceTitle: string; from: FromPrice }) {
  const picked = usePackageSelection();
  return (
    <div className="flex flex-col gap-3 rounded-tl-[1.5rem] rounded-br-[1.5rem] bg-ink p-5 text-fog">
      <span className="label text-jade">{picked ? "Your selection" : "You're asking about"}</span>
      <span className="font-display text-[1.1rem] leading-snug font-semibold">{picked ? picked.packageName : experienceTitle}</span>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-dashed border-white/20 pt-3">
        <span className="text-[0.85rem] text-fog/60">{picked ? picked.travellers : `From · ${from.unit}`}</span>
        <span className="font-display text-[1.6rem] leading-none font-bold tracking-[-0.02em] tabular-nums">
          {picked ? (picked.total != null ? formatInr(picked.total) : "Quote on request") : formatInr(from.price)}
        </span>
      </div>
    </div>
  );
}
