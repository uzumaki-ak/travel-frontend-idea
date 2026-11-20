"use client";

/**
 * The package the visitor has picked, shared outside the package picker: the
 * price ticket, the phone bottom bar and the enquiry popup all show it.
 * `null` until the visitor actually picks a package (or changes travellers).
 */
import { useSyncExternalStore } from "react";
import { ENQUIRY_PREFILL_EVENT } from "@/features/enquiry/enquiry-form";

export type PackageSelection = {
  packageName: string;
  /** Null when the group size needs a custom quote. */
  total: number | null;
  compareAt: number | null;
  travellers: string;
  /** Ready-made enquiry message for the form. */
  message: string;
};

let current: PackageSelection | null = null;
const listeners = new Set<() => void>();

export function setPackageSelection(next: PackageSelection | null) {
  current = next;
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePackageSelection() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}

/** Fill the enquiry form with the current selection. Call it from a link to `#enquiry`. */
export function prefillBooking() {
  if (current) window.dispatchEvent(new CustomEvent(ENQUIRY_PREFILL_EVENT, { detail: { message: current.message } }));
}
