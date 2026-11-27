/**
 * One row per cab: outline, name, category / seats / AC, the km or hours
 * included with extra rates, waiting, free cancellation, and the fare.
 * The whole row is the button ("Select"); sold-out rows cannot be chosen.
 */
import { formatInr } from "@/features/experiences/format";
import { CheckIcon, ClockIcon } from "@/ui/icons";
import { CarArt } from "./car-art";
import type { CabQuote } from "./review-types";

const rate = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 1 });

/** Lines under the cab name (also reused on the review screen). */
export function quoteLines(q: CabQuote, freeCancelHours: number): { text: string; ok?: boolean }[] {
  const v = q.vehicle;
  const out: { text: string; ok?: boolean }[] = [];
  if (q.hours) {
    out.push({ text: `${q.hours} hrs / ${q.km.toLocaleString("en-IN")} km included` });
    const extras = [v.extraKm ? `Extra ₹${rate(v.extraKm)}/km` : "", v.extraHour ? `Extra ₹${rate(v.extraHour)}/hr` : ""].filter(Boolean);
    if (extras.length) out.push({ text: extras.join(" · ") });
  } else if (q.km) {
    out.push({ text: v.extraKm ? `${q.km.toLocaleString("en-IN")} km included · ₹${rate(v.extraKm)}/km after` : `${q.km.toLocaleString("en-IN")} km included` });
  }
  if (q.wait) out.push({ text: `${q.wait} min free waiting after landing` });
  else if (v.waiting && !q.hours) out.push({ text: `Waiting ₹${rate(v.waiting)}/hour` });
  if (freeCancelHours) out.push({ text: `Free cancellation up to ${freeCancelHours} hours before the ride`, ok: true });
  return out;
}

export const vehicleMeta = (q: CabQuote) => [q.vehicle.category, `${q.vehicle.seats} seats`, q.vehicle.ac ? "AC" : "Non AC"].filter(Boolean);

export function CabRow({ quote, freeCancelHours, onSelect, selectLabel = "Select" }: { quote: CabQuote; freeCancelHours: number; onSelect?: () => void; selectLabel?: string }) {
  const q = quote;
  return (
    <button
      type="button"
      disabled={q.soldOut}
      onClick={onSelect}
      className="group grid w-full cursor-pointer grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-xl border border-ink/10 bg-fog p-4 text-left transition-[border-color,box-shadow,translate] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-[0_18px_40px_-24px_rgb(8_44_41/0.5)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:p-5"
    >
      <span className="grid aspect-[4/3] place-items-center rounded-lg bg-cloud px-2">
        {q.vehicle.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded cab photos arrive later
          <img src={q.vehicle.image} alt="" className="max-h-full w-full object-contain" />
        ) : (
          <CarArt shape={q.vehicle.shape} className="w-full" />
        )}
      </span>
      <span className="flex min-w-0 flex-col gap-2">
        <span className="font-display text-[1.1rem] leading-tight font-semibold tracking-[-0.01em]">{q.vehicle.name}</span>
        <span className="flex flex-wrap gap-1.5">
          {vehicleMeta(q).map((m) => (
            <span key={m} className="rounded-full bg-cloud px-2.5 py-0.5 text-[0.78rem] font-medium text-moss">
              {m}
            </span>
          ))}
        </span>
        <span className="hidden flex-col gap-1 text-[0.85rem] text-moss sm:flex">
          {quoteLines(q, freeCancelHours).map((l) => (
            <span key={l.text} className={`flex items-center gap-2 ${l.ok ? "text-river" : ""}`}>
              {l.ok ? <CheckIcon className="shrink-0" /> : <ClockIcon className="shrink-0 opacity-70" />}
              {l.text}
            </span>
          ))}
        </span>
      </span>
      <span className="col-span-2 flex items-end justify-between gap-4 border-t border-ink/10 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
        <span className="flex flex-col sm:items-end">
          <span className="font-mono text-[1.35rem] leading-none font-semibold tabular-nums">{formatInr(q.fare)}</span>
          {q.note ? <span className="mt-1.5 text-[0.75rem] text-moss tabular-nums">{q.note}</span> : null}
          {q.alt ? <span className="mt-1.5 text-[0.75rem] text-moss tabular-nums">Round trip (same day) {formatInr(q.alt)}</span> : null}
        </span>
        <span
          className={`inline-flex min-w-24 items-center justify-center rounded-full px-5 py-2 font-display text-[0.9rem] font-semibold transition-colors ${
            q.soldOut ? "bg-ink/10 text-moss" : "bg-ink text-fog group-hover:bg-mandarin group-hover:text-ink"
          }`}
        >
          {q.soldOut ? "Sold out" : selectLabel}
        </span>
      </span>
    </button>
  );
}
