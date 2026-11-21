"use client";

/**
 * The phone bottom bar's main button on experience pages:
 *  - no package picked → "Select package" (scrolls to the packages);
 *  - a package picked and the packages still in/near view → "Book now" (opens
 *    the enquiry popup, prefilled with the pick);
 *  - a package picked but scrolled well past the packages → back to "Select
 *    package", so a tap takes them up to re-check the card.
 */
import { useEffect, useState } from "react";
import { prefillBooking, usePackageSelection } from "./selection-store";
import { SmoothAnchor } from "./smooth-anchor";

const CLASS = "flex flex-1 items-center justify-center rounded-full bg-mandarin px-5 py-3 font-display text-base font-semibold text-ink md:hidden";

// Flip back to "Select package" once scrolled this far (as a share of a screen
// height) beyond the bottom of the packages section.
const PAST_THRESHOLD = 0.15;

export function BookingDockButton() {
  const picked = usePackageSelection();
  const [pastPackages, setPastPackages] = useState(false);

  useEffect(() => {
    const el = document.getElementById("packages");
    if (!el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      // How far the section's bottom has scrolled above the viewport, in screens.
      const past = -rect.bottom / window.innerHeight;
      setPastPackages(past > PAST_THRESHOLD);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    onScroll(); // first read (async, so no setState during render)
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  if (picked && !pastPackages) {
    return (
      <a href="#enquiry" onClick={prefillBooking} className={CLASS}>
        Book now
      </a>
    );
  }
  return (
    <SmoothAnchor href="#packages" className={CLASS}>
      Select package
    </SmoothAnchor>
  );
}
