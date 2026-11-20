"use client";

/**
 * The phone bottom bar's main button on experience pages: "Select package"
 * (scrolls to the packages) until one is picked, then "Book now" (opens the
 * enquiry popup, prefilled with the pick).
 */
import { prefillBooking, usePackageSelection } from "./selection-store";
import { SmoothAnchor } from "./smooth-anchor";

const CLASS = "flex flex-1 items-center justify-center rounded-full bg-mandarin px-5 py-3 font-display text-base font-semibold text-ink md:hidden";

export function BookingDockButton() {
  const picked = usePackageSelection();
  return picked ? (
    <a href="#enquiry" onClick={prefillBooking} className={CLASS}>
      Book now
    </a>
  ) : (
    <SmoothAnchor href="#packages" className={CLASS}>
      Select package
    </SmoothAnchor>
  );
}
