"use client";

/**
 * Price box from the live page: tier switch (Standard / Deluxe / Premium),
 * price "per person", the "may vary" note and the enquiry action.
 * Tiers are native radio inputs styled as a segmented control.
 */
import { useId, useState } from "react";
import type { PriceTier } from "@/content/tours";
import { ArrowRightIcon, WhatsAppIcon } from "@/ui/icons";

type BookingCardProps = {
  tiers: PriceTier[];
  note?: string;
  enquireLabel: string;
  whatsapp: { href: string; label: string; value: string };
};

export function BookingCard({ tiers, note, enquireLabel, whatsapp }: BookingCardProps) {
  const [active, setActive] = useState(0);
  const groupId = useId();
  const tier = tiers[active];
  const named = tiers.length > 1 && tiers.every((t) => t.name);

  return (
    <div className="flex flex-col gap-6 rounded-tl-[2.25rem] rounded-br-[2.25rem] bg-ink p-6 text-fog md:p-7">
      {named ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Package type</legend>
          <div className="grid grid-flow-col gap-1 rounded-full bg-white/8 p-1">
            {tiers.map((t, i) => (
              <label
                key={t.name}
                className="relative cursor-pointer rounded-full px-3 py-2 text-center text-[0.9rem] font-medium text-fog/70 transition-colors has-checked:bg-fog has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-mandarin"
              >
                <input
                  type="radio"
                  name={groupId}
                  value={t.name}
                  checked={i === active}
                  onChange={() => setActive(i)}
                  className="sr-only"
                />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : tier?.name ? (
        <p className="label text-jade">{tier.name}</p>
      ) : null}

      {tier ? (
        <p className="flex flex-wrap items-baseline gap-x-2" aria-live="polite">
          <span key={tier.amount} className="font-display text-[clamp(2.4rem,5vw,3.25rem)] leading-none font-bold tracking-[-0.03em] tabular-nums motion-safe:animate-[fade-in_0.5s_var(--ease-out-expo)]">
            <span aria-hidden="true">₹</span>
            <span className="sr-only">Rupees</span> {tier.amount}
          </span>
          <span className="text-[0.95rem] text-fog/70">{tier.unit}</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <a
          href="#enquiry"
          className="group inline-flex items-center justify-between gap-3 rounded-full bg-mandarin py-2.5 pr-2.5 pl-6 font-display text-[1.05rem] font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
        >
          {enquireLabel}
          <span className="grid size-10 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
            <ArrowRightIcon />
          </span>
        </a>
        <a
          href={whatsapp.href}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-[0.9rem] transition-colors hover:border-jade hover:text-jade"
        >
          <WhatsAppIcon className="text-lg" />
          <span className="text-fog/70">{whatsapp.label}</span>
          <span className="font-mono text-[0.8rem] tabular-nums">{whatsapp.value}</span>
        </a>
      </div>

      {note ? <p className="text-[0.85rem] text-fog/60">{note}</p> : null}
    </div>
  );
}
