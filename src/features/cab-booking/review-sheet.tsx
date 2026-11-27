"use client";

/**
 * "Review booking": opens when a cab is chosen. Trip summary (Edit goes back to
 * the search), the cab "or similar" with km and free-cancellation tiles, the
 * fare breakdown, notices, inclusions with a "View Policies" sheet (tabs),
 * traveller details, and a bar that stays at the bottom: Part Pay / Full Pay,
 * Pay Now. It opens as a drawer (bottom on phones, right on larger screens);
 * "View policies" turns the same drawer into the policies, with a back arrow.
 *
 * Payments are not connected yet, so Pay Now checks the details and then says
 * so plainly, with Call and WhatsApp to confirm the booking by hand.
 */
import { useState } from "react";
import { formatInr } from "@/features/experiences/format";
import { CheckIcon, ClockIcon, CrossIcon, PhoneIcon, WhatsAppIcon } from "@/ui/icons";
import { CarArt } from "./car-art";
import { vehicleMeta } from "./cab-rows";
import { Drawer, DRAWER_BODY } from "./drawer";
import type { CabQuote, ReviewTrip } from "./review-types";

type Errors = Partial<Record<string, string>>;

export type ReviewView = "review" | "policies" | "done";

export function ReviewSheet({ trip, quote, open, onOpenChange, onEdit }: { trip: ReviewTrip; quote: CabQuote | null; open: boolean; onOpenChange: (o: boolean) => void; onEdit: () => void }) {
  const [view, setView] = useState<ReviewView>("review");
  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) setView("review");
  };
  return (
    <Drawer
      open={open}
      onOpenChange={close}
      tall
      title={view === "policies" ? "Policies" : view === "done" ? "Booking request" : "Review booking"}
      back={view === "policies" ? () => setView("review") : () => close(false)}
    >
      {quote ? <Body key={quote.vehicle.id} trip={trip} quote={quote} view={view} setView={setView} onEdit={onEdit} /> : null}
    </Drawer>
  );
}

function Body({ trip, quote, view, setView, onEdit }: { trip: ReviewTrip; quote: CabQuote; view: ReviewView; setView: (v: ReviewView) => void; onEdit: () => void }) {
  const [mode, setMode] = useState<"part" | "full">("part");
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<null | { name: string; phone: string }>(null);
  const [policyTab, setPolicyTab] = useState(trip.policies[0]?.id ?? "");

  const pay = mode === "part" ? quote.part : quote.fare;
  const balance = quote.fare - quote.part;
  const kmTile = quote.hours ? `${quote.hours} hrs / ${quote.km.toLocaleString("en-IN")} km included` : quote.km ? `${quote.km.toLocaleString("en-IN")} km included` : "Point to point trip";
  const kmLine = quote.hours
    ? `Extra ₹${quote.vehicle.extraKm}/km and ₹${quote.vehicle.extraHour}/hr beyond the package`
    : quote.vehicle.extraKm && quote.km
      ? `₹${quote.vehicle.extraKm}/km will apply beyond the included kms`
      : "";

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const next: Errors = {};
    if (f.has("address") && !get("address")) next.address = "Please enter the address.";
    if (!get("name")) next.name = "Please enter your name.";
    if (!/^(\+?91[\s-]?)?[6-9]\d{9}$/.test(get("phone").replace(/[\s-]/g, ""))) next.phone = "Please enter a valid 10-digit mobile number.";
    if (get("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email"))) next.email = "Please enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length) {
      e.currentTarget.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setDone({ name: get("name"), phone: get("phone") });
    setView("done");
  };

  const wa = trip.whatsapp
    ? `https://wa.me/${trip.whatsapp}?text=${encodeURIComponent(`Hello, I want to book ${quote.vehicle.name} for ${trip.label}: ${trip.from} to ${trip.to}, ${trip.when}. Fare ${formatInr(quote.fare)}.`)}`
    : null;
  const tel = `tel:${trip.phone.replace(/[^0-9+]/g, "")}`;

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      {view === "done" && done ? (
        <div className={`${DRAWER_BODY} flex flex-col gap-5 px-4 py-6 md:px-6`}>
          <div className="flex flex-col gap-3 rounded-xl bg-fog p-6">
            <p className="font-display text-[1.4rem] leading-tight font-bold tracking-[-0.02em]">Thanks, {done.name.split(" ")[0]}. One last step.</p>
            <p className="leading-relaxed text-ink/80">
              Online payment is being set up, so this cab is not booked yet. Call or WhatsApp us and we will confirm it on {done.phone} straight away.
            </p>
          </div>
          <Summary trip={trip} quote={quote} />
          <div className="grid gap-2 sm:grid-cols-2">
            <a href={tel} className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-5 py-3.5 font-display font-semibold text-fog transition-transform hover:-translate-y-0.5">
              <PhoneIcon />
              Call {trip.phone}
            </a>
            {wa ? (
              <a href={wa} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-jade px-5 py-3.5 font-display font-semibold text-river-deep transition-transform hover:-translate-y-0.5">
                <WhatsAppIcon />
                WhatsApp us
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {/* Policies: shown in place of the review (the form stays mounted, so typed details are kept). */}
          {view === "policies" ? (
            <div className={`${DRAWER_BODY} flex flex-col`}>
              <div role="tablist" className="scrollbar-none flex gap-1.5 overflow-x-auto px-4 py-3 md:px-6">
                {trip.policies.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={policyTab === p.id}
                    onClick={() => setPolicyTab(p.id)}
                    className="shrink-0 cursor-pointer rounded-full border border-ink/15 px-4 py-2 text-[0.88rem] font-medium transition-colors aria-selected:border-ink aria-selected:bg-ink aria-selected:text-fog"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <ul className="flex flex-col gap-4 px-4 pb-8 md:px-6">
                {trip.policies
                  .find((p) => p.id === policyTab)
                  ?.items.map(([t, d]) => (
                    <Item key={t} title={t} text={d} ok={policyTab === "inclusions"} cross={policyTab === "exclusions"} />
                  ))}
              </ul>
            </div>
          ) : null}
          <div className={`${DRAWER_BODY} flex-col gap-3 px-3 py-4 md:px-6 md:py-6 ${view === "policies" ? "hidden" : "flex"}`}>
            {/* Trip */}
            <section className="flex flex-col gap-2 rounded-xl bg-fog p-5">
              <p className="text-[0.82rem] font-medium text-moss">{trip.label}</p>
              <p className="flex items-center gap-3 font-display text-[1.15rem] font-semibold tracking-[-0.01em]">
                {trip.from}
                <span aria-hidden="true" className="h-px min-w-8 flex-1 border-t border-dashed border-ink/30" />
                {trip.to}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9rem] text-moss">
                {trip.when}
                <button type="button" onClick={onEdit} className="cursor-pointer font-medium text-ink underline decoration-mandarin decoration-2 underline-offset-4">
                  Edit
                </button>
              </p>
            </section>

            {/* Cab */}
            <section className="flex flex-col gap-4 rounded-xl bg-fog p-5">
              <div className="flex items-center gap-4">
                <span className="grid aspect-[4/3] w-24 shrink-0 place-items-center rounded-lg bg-cloud px-2">
                  <CarArt shape={quote.vehicle.shape} className="w-full" />
                </span>
                <div className="flex flex-col gap-1">
                  <p>
                    <strong className="font-display text-[1.1rem] font-semibold">{quote.vehicle.name}</strong> <span className="text-[0.85rem] text-moss">or similar</span>
                  </p>
                  <p className="text-[0.88rem] text-moss">{vehicleMeta(quote).join(" · ")}</p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Tile icon={<RoadGlyph />} text={kmTile} />
                {trip.cancelUntil ? <Tile icon={<ClockIcon />} text={trip.cancelUntil} /> : null}
              </div>
              {quote.note ? <p className="rounded-lg bg-cloud px-4 py-3 text-[0.88rem] tabular-nums">Fare: {quote.note} = {formatInr(quote.fare)}</p> : null}
            </section>

            {trip.notices.map((n) => (
              <p key={n} className="rounded-xl border border-mandarin/40 bg-mandarin/10 px-4 py-3 text-[0.9rem] leading-relaxed">
                {n}
              </p>
            ))}
            {trip.dropNote ? <p className="rounded-xl border border-ink/10 bg-fog px-4 py-3 text-[0.88rem] leading-relaxed text-moss">{trip.dropNote}</p> : null}

            {/* Inclusions */}
            <section className="flex flex-col gap-3 rounded-xl bg-fog p-5">
              <h3 className="font-display text-[1.05rem] font-semibold">Inclusions</h3>
              <ul className="flex flex-col gap-3">
                <Item title={kmTile} text={kmLine} ok />
                {trip.inclusions.slice(0, 3).map(([t, d]) => (
                  <Item key={t} title={t} text={d} ok />
                ))}
              </ul>
              {trip.policies.length ? (
                <button type="button" onClick={() => setView("policies")} className="cursor-pointer self-start font-display text-[0.92rem] font-semibold underline decoration-mandarin decoration-2 underline-offset-4">
                  View policies ›
                </button>
              ) : null}
            </section>

            {/* Traveller */}
            <section className="flex flex-col gap-4 rounded-xl bg-fog p-5">
              <h3 className="font-display text-[1.05rem] font-semibold">Traveller details</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <TravellerFields trip={trip} errors={errors} />
              </div>
            </section>
          </div>

          {/* Pay bar */}
          <footer className={`border-t border-ink/10 bg-fog px-3 pt-3 md:px-6 ${view === "policies" ? "hidden" : ""}`} style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
            <p className="pb-2 text-[0.8rem] text-moss">
              {mode === "part" ? `Pay ${trip.partPercent}% now, ${formatInr(balance)} to the driver.` : "Pay the full fare now, nothing to pay the driver."}
            </p>
            <div className="flex flex-wrap items-stretch gap-2">
              <div role="radiogroup" aria-label="Payment" className="grid flex-1 grid-cols-2 gap-2">
                {(["part", "full"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    onClick={() => setMode(m)}
                    className="flex cursor-pointer flex-col items-start rounded-xl border border-ink/15 px-3 py-2 text-left transition-colors aria-checked:border-ink aria-checked:bg-ink aria-checked:text-fog"
                  >
                    <span className="text-[0.78rem]">{m === "part" ? "Part pay" : "Full pay"}</span>
                    <span className="font-mono font-semibold tabular-nums">{formatInr(m === "part" ? quote.part : quote.fare)}</span>
                  </button>
                ))}
              </div>
              <button type="submit" className="min-w-36 cursor-pointer rounded-xl bg-mandarin px-6 font-display font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 max-sm:w-full max-sm:py-3.5">
                Pay {formatInr(pay)}
              </button>
            </div>
          </footer>

        </>
      )}
    </form>
  );
}

function TravellerFields({ trip, errors }: { trip: ReviewTrip; errors: Errors }) {
  const address =
    trip.kind === "outstation"
      ? { label: `Pick-up address in ${trip.from}`, placeholder: "House, street, landmark" }
      : trip.kind === "airport-pickup"
        ? { label: `Drop address in ${trip.to}`, placeholder: "Hotel, street, landmark" }
        : trip.kind === "airport-drop"
          ? { label: `Pick-up address in ${trip.from}`, placeholder: "Hotel, street, landmark" }
          : { label: `Exact pick-up address in ${trip.from}`, placeholder: "House, street, landmark" };
  return (
    <>
      <Field name="address" label={address.label} placeholder={address.placeholder} required wide error={errors.address} />
      {trip.kind === "outstation" ? <Field name="drop" label={`Drop address in ${trip.to}`} placeholder="Hotel, street, landmark" wide /> : null}
      {trip.kind.startsWith("airport") ? <Field name="flight" label="Flight number" placeholder="6E 2341" maxLength={12} /> : null}
      <Field name="name" label="Full name" autoComplete="name" required error={errors.name} />
      <Field name="phone" label="Mobile number" type="tel" placeholder="+91" autoComplete="tel" required error={errors.phone} />
      <Field name="email" label="Email (for your receipt)" type="email" autoComplete="email" wide={!trip.kind.startsWith("airport")} error={errors.email} />
      <Field name="notes" label="Anything we should know?" wide textarea />
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
  wide,
  textarea,
  error,
  autoComplete,
  maxLength,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  wide?: boolean;
  textarea?: boolean;
  error?: string;
  autoComplete?: string;
  maxLength?: number;
}) {
  const id = `rv-${name}`;
  const cls =
    "w-full rounded-lg border border-ink/15 bg-cloud px-3.5 py-3 text-[0.98rem] transition-colors placeholder:text-moss/50 focus:border-ink focus:outline-none aria-invalid:border-mandarin";
  return (
    <p className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="text-[0.85rem] font-medium">
        {label}
        {required ? <span className="text-mandarin"> *</span> : null}
      </label>
      {textarea ? (
        <textarea id={id} name={name} rows={2} className={cls} />
      ) : (
        <input id={id} name={name} type={type} placeholder={placeholder} autoComplete={autoComplete} maxLength={maxLength} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-err` : undefined} className={cls} />
      )}
      {error ? (
        <span id={`${id}-err`} className="text-[0.82rem] text-mandarin">
          {error}
        </span>
      ) : null}
    </p>
  );
}

function Summary({ trip, quote }: { trip: ReviewTrip; quote: CabQuote }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-xl bg-fog p-5 text-[0.92rem]">
      <dt className="text-moss">Trip</dt>
      <dd>{trip.label}</dd>
      <dt className="text-moss">Route</dt>
      <dd>
        {trip.from} → {trip.to}
      </dd>
      <dt className="text-moss">When</dt>
      <dd>{trip.when}</dd>
      <dt className="text-moss">Cab</dt>
      <dd>{quote.vehicle.name}</dd>
      <dt className="text-moss">Fare</dt>
      <dd className="font-mono font-semibold tabular-nums">{formatInr(quote.fare)}</dd>
    </dl>
  );
}

function Tile({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-cloud px-4 py-3 text-[0.88rem] font-medium">
      <span className="text-river">{icon}</span>
      {text}
    </div>
  );
}

function Item({ title, text, ok, cross }: { title: string; text?: string; ok?: boolean; cross?: boolean }) {
  return (
    <li className="flex gap-3">
      <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[0.65rem] ${ok ? "bg-jade text-river-deep" : cross ? "bg-mandarin/20 text-mandarin" : "bg-ink/10 text-ink"}`}>
        {cross ? <CrossIcon /> : <CheckIcon />}
      </span>
      <span className="flex flex-col gap-0.5">
        <strong className="text-[0.92rem] font-semibold">{title}</strong>
        {text ? <span className="text-[0.85rem] leading-relaxed text-moss">{text}</span> : null}
      </span>
    </li>
  );
}

function RoadGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[1.1em] fill-current">
      <path d="M18 15a3 3 0 0 0-2.83 2H9.5a2.5 2.5 0 0 1 0-5h5a4.5 4.5 0 0 0 0-9H8.83A3 3 0 1 0 6 6a3 3 0 0 0 2.83-2h5.67a2.5 2.5 0 0 1 0 5h-5a4.5 4.5 0 0 0 0 9h5.67A3 3 0 1 0 18 15z" />
    </svg>
  );
}
