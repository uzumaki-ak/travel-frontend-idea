"use client";

/**
 * The "trail ticket": a perforated stub. Before a package is picked it shows the
 * lowest price and "Choose package"; once one is picked it shows that package,
 * its total and "Book now" (opens the enquiry popup, prefilled).
 * Notches are circles in the page (fog) colour.
 */
import type { FromPrice } from "@/content/experiences";
import { ArrowRightIcon } from "@/ui/icons";
import { formatInr, plural, savingPercent } from "./format";
import { prefillBooking, usePackageSelection } from "./selection-store";
import { SmoothAnchor } from "./smooth-anchor";

const BUTTON =
  "group inline-flex shrink-0 items-center gap-3 rounded-full bg-mandarin py-2 pr-2 pl-5 font-display font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5";
const ARROW = "grid size-9 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover:translate-x-1";
const PRICE = "font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-none font-bold tracking-[-0.03em] tabular-nums";

export function PriceTicket({ from, packageCount }: { from: FromPrice; packageCount: number }) {
  const picked = usePackageSelection();
  const saving = picked
    ? picked.total != null
      ? savingPercent(picked.total, picked.compareAt ?? undefined)
      : 0
    : savingPercent(from.price, from.compareAt);
  const compareAt = picked ? picked.compareAt : from.compareAt;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[1.75rem] bg-ink text-fog" aria-live="polite">
      <div className="flex items-start justify-between gap-4 p-6 pb-5">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="label text-jade">{picked ? "Your selection" : "From"}</span>
          {picked ? <span className="font-display text-[1.05rem] leading-snug font-semibold">{picked.packageName}</span> : null}
          <span className="flex flex-wrap items-baseline gap-x-2">
            {picked && picked.total == null ? (
              <span className="font-display text-[1.4rem] leading-tight font-bold">Quote on request</span>
            ) : (
              <span key={picked?.total ?? from.price} className={`${PRICE} motion-safe:animate-[fade-in_0.4s_var(--ease-out-expo)]`}>
                {formatInr(picked?.total ?? from.price)}
              </span>
            )}
            {compareAt && saving ? <s className="font-mono text-[0.85rem] text-fog/50 tabular-nums">{formatInr(compareAt)}</s> : null}
          </span>
          <span className="text-[0.85rem] text-fog/60">{picked ? `Total · ${picked.travellers}` : from.unit}</span>
        </div>
        {saving ? <span className="shrink-0 rounded-full bg-jade px-3 py-1 label text-river-deep">−{saving}%</span> : null}
      </div>

      <div aria-hidden="true" className="relative mx-6 border-t border-dashed border-white/20">
        <span className="absolute -top-3 -left-9 size-6 rounded-full bg-fog" />
        <span className="absolute -top-3 -right-9 size-6 rounded-full bg-fog" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-6 pt-5">
        {picked ? (
          <SmoothAnchor href="#packages" className="font-mono text-[0.75rem] leading-relaxed text-fog/60 underline underline-offset-4 transition-colors hover:text-fog">
            Change package
          </SmoothAnchor>
        ) : (
          <span className="font-mono text-[0.75rem] leading-relaxed whitespace-nowrap text-fog/60">
            {plural(packageCount, "package", "packages")}
            <br />
            Reserve now, pay later
          </span>
        )}
        {picked ? (
          <a href="#enquiry" onClick={prefillBooking} className={BUTTON}>
            Book now
            <span className={ARROW}>
              <ArrowRightIcon />
            </span>
          </a>
        ) : (
          <SmoothAnchor href="#packages" className={BUTTON}>
            Choose package
            <span className={ARROW}>
              <ArrowRightIcon />
            </span>
          </SmoothAnchor>
        )}
      </div>
    </div>
  );
}
