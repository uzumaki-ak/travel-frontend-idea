"use client";

/**
 * The package page's booking side: "Choose your cab" (price per cab for the
 * whole trip), a booking card that stays in view (right column on desktop, a
 * bar at the bottom on phones), and two dialogs:
 *  - Book Now: name, phone, email, adults, children, pickup point, travel date
 *    and pickup time, full or part (30%) payment. More adults than seats asks
 *    for a bigger cab or a custom trip.
 *  - Customize Package: what they want to change, sent to us on WhatsApp.
 * Both open as drawers. Payments are not connected yet, so Book Now ends with
 * Call / WhatsApp.
 */
import { useState } from "react";
import type { CabSettings, Vehicle } from "@/content/cab-booking/schema";
import { formatInr } from "@/features/experiences/format";
import { PhoneIcon, WhatsAppIcon } from "@/ui/icons";
import { CarArt } from "./car-art";
import { Drawer, DRAWER_BODY } from "./drawer";
import { ChoiceField, useNow, WhenField } from "./fields";
import { defaultPickup, pickupProblem, serviceHoursMessage, whenLabel, type When } from "./rules";

export type PackageOption = { vehicle: Vehicle; price: number; part: number };

type Props = {
  title: string;
  badge: string;
  start: string;
  options: PackageOption[];
  settings: CabSettings;
  /** Server-rendered package details shown under "Choose your cab". */
  children: React.ReactNode;
};

export function PackageBooking({ title, badge, start, options, settings, children }: Props) {
  const [picked, setPicked] = useState(options[0]?.vehicle.id ?? "");
  const [dialog, setDialog] = useState<null | "book" | "custom">(null);
  const opt = options.find((o) => o.vehicle.id === picked) ?? options[0];
  const s = settings;
  const tel = `tel:${s.phone.replace(/[^0-9+]/g, "")}`;

  return (
    <div className="grid gap-12 pb-28 lg:grid-cols-12 lg:gap-12 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-14 lg:col-span-8">
        {options.length ? (
          <section aria-labelledby="cab-title" className="flex flex-col gap-5">
            <h2 id="cab-title" className="font-display text-[1.6rem] font-bold tracking-[-0.02em]">
              Choose your cab
            </h2>
            <div role="radiogroup" aria-labelledby="cab-title" className="grid gap-3 sm:grid-cols-2">
              {options.map((o) => (
                <button
                  key={o.vehicle.id}
                  type="button"
                  role="radio"
                  aria-checked={picked === o.vehicle.id}
                  onClick={() => setPicked(o.vehicle.id)}
                  className="group flex cursor-pointer items-center gap-4 rounded-xl border border-ink/12 bg-fog p-4 text-left transition-colors hover:border-ink/40 aria-checked:border-ink aria-checked:bg-ink aria-checked:text-fog"
                >
                  <span className="grid aspect-[4/3] w-20 shrink-0 place-items-center rounded-lg bg-cloud px-1.5">
                    <CarArt shape={o.vehicle.shape} className="w-full" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-display font-semibold">{o.vehicle.name}</span>
                    <span className="text-[0.82rem] opacity-70">
                      {o.vehicle.category} · {o.vehicle.seats} seats · {o.vehicle.ac ? "AC" : "Non AC"}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-mono text-[1.05rem] font-semibold tabular-nums">{formatInr(o.price)}</span>
                    <span className="text-[0.7rem] opacity-70">per cab</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[0.88rem] text-moss">Price is for the whole cab for the full trip, not per person.</p>
          </section>
        ) : null}
        {children}
      </div>

      {/* Booking card: right column (desktop), bottom bar (phones). */}
      <aside className="lg:col-span-4">
        <div className="hidden flex-col gap-5 rounded-2xl bg-river-deep p-6 text-fog lg:sticky lg:top-[calc(var(--header-h)+3rem)] lg:flex">
          <span className="self-start rounded-full bg-jade px-3 py-0.5 font-mono text-[0.78rem] font-semibold text-river-deep">{badge}</span>
          {opt ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[0.82rem] text-fog/60">Package price · {opt.vehicle.name}</span>
                <span className="font-mono text-[2rem] leading-none font-semibold tabular-nums">{formatInr(opt.price)}</span>
                <span className="text-[0.8rem] text-fog/60">per cab, for the full trip</span>
              </div>
              <p className="text-[0.88rem] text-fog/75">Pickup: {start}</p>
              <button type="button" onClick={() => setDialog("book")} className="cursor-pointer rounded-xl bg-mandarin px-5 py-3.5 font-display font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5">
                Book now
              </button>
            </>
          ) : (
            <p className="text-fog/80">Price on request. Tap Customize Package and we will send you a quote.</p>
          )}
          <button type="button" onClick={() => setDialog("custom")} className="cursor-pointer rounded-xl border border-fog/30 px-5 py-3.5 font-display font-semibold transition-colors hover:bg-fog hover:text-ink">
            Customize package
          </button>
          <div className="flex gap-2 border-t border-white/10 pt-4">
            <a href={tel} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2.5 text-[0.88rem] font-medium hover:bg-white/10">
              <PhoneIcon />
              Call
            </a>
            {s.whatsapp ? (
              <a href={waLink(s.whatsapp, `Hello, I want to enquire about ${title}`)} target="_blank" rel="noopener" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2.5 text-[0.88rem] font-medium hover:bg-white/10">
                <WhatsAppIcon />
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-[4.5rem] z-30 flex items-center gap-3 border-t border-ink/10 bg-fog/95 px-4 py-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[0.75rem] text-moss">{opt ? `${opt.vehicle.name} · per cab` : "Price on request"}</span>
          {opt ? <span className="font-mono text-[1.15rem] font-semibold tabular-nums">{formatInr(opt.price)}</span> : null}
        </span>
        <button type="button" onClick={() => setDialog("custom")} className="cursor-pointer rounded-xl border border-ink/20 px-4 py-3 text-[0.9rem] font-semibold">
          Customize
        </button>
        {opt ? (
          <button type="button" onClick={() => setDialog("book")} className="cursor-pointer rounded-xl bg-mandarin px-5 py-3 font-display font-semibold text-ink">
            Book now
          </button>
        ) : null}
      </div>

      <Drawer open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)} tall={dialog === "book"} title={dialog === "custom" ? "Customize this package" : "Book now"}>
        {dialog === "book" && opt ? (
          <BookForm title={title} options={options} picked={opt} onPick={setPicked} settings={s} onCustomize={() => setDialog("custom")} />
        ) : dialog === "custom" ? (
          <CustomForm title={title} settings={s} />
        ) : null}
      </Drawer>
    </div>
  );
}

const waLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

const INPUT = "w-full rounded-lg border border-ink/15 bg-fog px-3.5 py-3 text-[0.98rem] placeholder:text-moss/50 focus:border-ink focus:outline-none aria-invalid:border-mandarin";

function Input({ label, name, required, wide, error, ...rest }: { label: string; name: string; required?: boolean; wide?: boolean; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <p className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={`pk-${name}`} className="text-[0.85rem] font-medium">
        {label}
        {required ? <span className="text-mandarin"> *</span> : null}
      </label>
      <input id={`pk-${name}`} name={name} aria-invalid={!!error || undefined} className={INPUT} {...rest} />
      {error ? <span className="text-[0.82rem] text-mandarin">{error}</span> : null}
    </p>
  );
}

const validContact = (f: FormData) => {
  const get = (k: string) => String(f.get(k) ?? "").trim();
  const e: Record<string, string> = {};
  if (!get("name")) e.name = "Please enter your name.";
  if (!/^(\+?91)?[6-9]\d{9}$/.test(get("phone").replace(/[\s-]/g, ""))) e.phone = "Please enter a valid 10-digit mobile number.";
  if (get("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email"))) e.email = "Please enter a valid email address.";
  return e;
};

function BookForm({ title, options, picked, onPick, settings: s, onCustomize }: { title: string; options: PackageOption[]; picked: PackageOption; onPick: (id: string) => void; settings: CabSettings; onCustomize: () => void }) {
  const now = useNow();
  const [whenPick, setWhen] = useState<When | null>(null);
  const when = whenPick ?? (now ? defaultPickup(s, now) : null);
  const [mode, setMode] = useState<"part" | "full">("part");
  const [adults, setAdults] = useState(2);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<null | { name: string; summary: string }>(null);
  const [hoursMsg, setHoursMsg] = useState(false);
  const tooMany = adults > picked.vehicle.seats;
  const bigger = options.find((o) => o.vehicle.seats >= adults);

  if (done) {
    return (
      <>
        <div className={`${DRAWER_BODY} flex flex-col gap-4 p-5`}>
          <p className="font-display text-[1.3rem] font-bold tracking-[-0.02em]">Thanks, {done.name.split(" ")[0]}. One last step.</p>
          <p className="leading-relaxed text-ink/80">Online payment is being set up, so this package is not booked yet. Send it to us on WhatsApp or call, and we will confirm it straight away.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href={`tel:${s.phone.replace(/[^0-9+]/g, "")}`} className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-5 py-3.5 font-display font-semibold text-fog">
              <PhoneIcon />
              Call {s.phone}
            </a>
            {s.whatsapp ? (
              <a href={waLink(s.whatsapp, done.summary)} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-jade px-5 py-3.5 font-display font-semibold text-river-deep">
                <WhatsAppIcon />
                Send on WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const next = validContact(f);
        if (!String(f.get("pickup") ?? "").trim()) next.pickup = "Please enter your pickup point.";
        const problem = when ? pickupProblem(when, "sightseeing", s) : "Please choose a travel date.";
        if (problem) next.when = problem;
        setErrors(next);
        if (Object.keys(next).length || tooMany || !when) return;
        const name = String(f.get("name"));
        setDone({
          name,
          summary: `Hello, I want to book ${title} with ${picked.vehicle.name} (${formatInr(picked.price)}), ${whenLabel(when)}, ${adults} adults and ${f.get("children")} children, pickup at ${f.get("pickup")}. Name: ${name}, phone ${f.get("phone")}. ${mode === "part" ? `Part payment (${s.packagePartPercent}%)` : "Full payment"}.`,
        });
      }}
    >
      <div className={`${DRAWER_BODY} grid content-start gap-3 p-5 sm:grid-cols-2`}>
        <div className="sm:col-span-2">
          <ChoiceField
            label="Cab"
            value={picked.vehicle.id}
            onChange={onPick}
            options={options.map((o) => ({ value: o.vehicle.id, label: `${o.vehicle.name} · ${o.vehicle.seats} seats · ${formatInr(o.price)}` }))}
          />
        </div>
        <Input label="Your name" name="name" required autoComplete="name" error={errors.name} />
        <Input label="Phone" name="phone" type="tel" placeholder="+91" required autoComplete="tel" error={errors.phone} />
        <Input label="Email (for your receipt)" name="email" type="email" wide autoComplete="email" error={errors.email} />
        <Input label="Adults" name="adults" type="number" min={1} max={40} value={adults} onChange={(e) => setAdults(Math.max(1, Number(e.target.value) || 1))} />
        <Input label="Children" name="children" type="number" min={0} max={20} defaultValue={0} />
        {tooMany ? (
          <p className="rounded-lg bg-mandarin/15 px-4 py-3 text-[0.88rem] sm:col-span-2">
            {picked.vehicle.name} seats {picked.vehicle.seats}.{" "}
            {bigger ? (
              <button type="button" onClick={() => onPick(bigger.vehicle.id)} className="cursor-pointer font-semibold underline underline-offset-4">
                Switch to {bigger.vehicle.name}
              </button>
            ) : null}
            {bigger ? " or " : ""}
            <button type="button" onClick={onCustomize} className="cursor-pointer font-semibold underline underline-offset-4">
              customize the trip
            </button>
            .
          </p>
        ) : null}
        <Input label="Pickup point (hotel, airport, station…)" name="pickup" required wide error={errors.pickup} />
        <div className="grid gap-2 sm:col-span-2 sm:grid-cols-1">
          <WhenField label="Travel date & pickup time" value={when} onChange={setWhen} service="sightseeing" settings={s} onOutOfHours={() => setHoursMsg(true)} />
          {errors.when || hoursMsg ? <span className="text-[0.82rem] text-mandarin">{errors.when ?? serviceHoursMessage(s)}</span> : null}
        </div>
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="pb-2 text-[0.85rem] font-medium">How would you like to pay?</legend>
          {(["part", "full"] as const).map((m) => (
            <label key={m} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-ink/15 px-4 py-3 has-checked:border-ink has-checked:bg-fog">
              <span className="flex items-center gap-3">
                <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} className="accent-ink" />
                {m === "part" ? `Part payment (${s.packagePartPercent}%)` : "Full payment"}
              </span>
              <span className="font-mono font-semibold tabular-nums">{formatInr(m === "part" ? picked.part : picked.price)}</span>
            </label>
          ))}
          {mode === "part" ? <span className="text-[0.8rem] text-moss">Pay {s.packagePartPercent}% now to confirm; the balance before the trip starts.</span> : null}
        </fieldset>
      </div>
      <div className="border-t border-ink/10 p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}>
        <button type="submit" disabled={tooMany} className="w-full cursor-pointer rounded-xl bg-mandarin px-6 py-3.5 font-display font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">
          Pay {formatInr(mode === "part" ? picked.part : picked.price)}
        </button>
      </div>
    </form>
  );
}

function CustomForm({ title, settings: s }: { title: string; settings: CabSettings }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  return (
    <form
      noValidate
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const next = validContact(f);
        setErrors(next);
        if (Object.keys(next).length) return;
        const text = `Hello, I want to customize ${title}. Name: ${f.get("name")}, phone ${f.get("phone")}, ${f.get("travellers") || "?"} travellers. Changes: ${f.get("message") || "-"}`;
        if (s.whatsapp) window.open(waLink(s.whatsapp, text), "_blank", "noopener");
      }}
    >
      <div className={`${DRAWER_BODY} grid content-start gap-3 p-5 sm:grid-cols-2`}>
        <p className="text-[0.92rem] leading-relaxed text-ink/80 sm:col-span-2">Tell us what you would like to change (places, days, cab or dates) and we will call you with a quote.</p>
        <Input label="Your name" name="name" required autoComplete="name" error={errors.name} />
        <Input label="Phone" name="phone" type="tel" placeholder="+91" required autoComplete="tel" error={errors.phone} />
        <Input label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Input label="Travellers" name="travellers" type="number" min={1} max={60} />
        <p className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="pk-message" className="text-[0.85rem] font-medium">
            What would you like to change?
          </label>
          <textarea id="pk-message" name="message" rows={3} className={INPUT} />
        </p>
      </div>
      <div className="border-t border-ink/10 p-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}>
        <button type="submit" className="inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-ink px-6 py-3.5 font-display font-semibold text-fog transition-transform hover:-translate-y-0.5">
          <WhatsAppIcon />
          Send enquiry on WhatsApp
        </button>
      </div>
    </form>
  );
}

