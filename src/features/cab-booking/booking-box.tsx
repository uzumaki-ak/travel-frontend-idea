"use client";

/**
 * The cab booking box: four tabs, each with its own search.
 *  - Outstation: One Way / Round Trip, pickup and drop city, date & time (+ return).
 *  - Sightseeing Taxi: location and duration → the packages page.
 *  - Airport: Pickup from / Drop to Airport (switching swaps From and To),
 *    From, To (an airport's own areas once it is chosen), date & time.
 *  - Hourly: city, pickup date, pickup time, package (hours and km only).
 * Choices are checked here (notice period, 90 days, service hours) and again on
 * the results page on the server, so the rules cannot be skipped.
 */
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { BoxConfig } from "@/content/cab-booking";
import type { Service } from "@/content/cab-booking/schema";
import { ArrowRightIcon, BinocularsIcon, CarIcon, ClockIcon, DepartIcon, PhoneIcon } from "@/ui/icons";
import { Drawer } from "./drawer";
import { ChoiceField, CityField, useNow, WhenField } from "./fields";
import { defaultPickup, defaultReturn, norm, pickupProblem, returnProblem, serviceHoursMessage, type When } from "./rules";
import { packagesHref, searchHref, type CabSearch } from "./search";

export type BoxInitial = {
  tab?: Service;
  trip?: "oneway" | "round";
  from?: string;
  to?: string;
  pickup?: When;
  ret?: When | null;
  dir?: "from" | "to";
  city?: string;
  slab?: string;
  loc?: string;
  days?: number;
};

const TABS: { id: Service; label: string; Icon: typeof CarIcon }[] = [
  { id: "outstation", label: "Outstation", Icon: CarIcon },
  { id: "sightseeing", label: "Sightseeing Taxi", Icon: BinocularsIcon },
  { id: "airport", label: "Airport", Icon: DepartIcon },
  { id: "hourly", label: "Hourly", Icon: ClockIcon },
];

export function BookingBox({
  config,
  initial = {},
  onSearched,
  stacked = false,
  sticky = false,
}: {
  config: BoxConfig;
  initial?: BoxInitial;
  onSearched?: () => void;
  /** One column (inside a drawer). */
  stacked?: boolean;
  /** Keep the four tabs in reach under the header once the box scrolls away. */
  sticky?: boolean;
}) {
  const router = useRouter();
  const s = config.settings;
  const [tab, setTab] = useState<Service>(initial.tab ?? "outstation");
  const [callOpen, setCallOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);
  const inBrowser = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Sticky tabs: shown once the box has scrolled up past the header.
  useEffect(() => {
    const el = root.current;
    if (!sticky || !el) return;
    const io = new IntersectionObserver(([e]) => setAway(!!e && !e.isIntersecting && e.boundingClientRect.bottom < 200), { rootMargin: "-96px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [sticky]);

  const jumpTo = (id: Service) => {
    setTab(id);
    setMsg("");
    const el = root.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  // Starting date/time: tomorrow at the default hour (as the plugin did), worked
  // out in the browser; until then the fields read "Tomorrow".
  const now = useNow();
  const start = initial.pickup ?? (now ? defaultPickup(s, now) : null);

  // Outstation
  const [trip, setTrip] = useState<"oneway" | "round">(initial.trip ?? "oneway");
  const [from, setFrom] = useState(initial.tab === "outstation" || !initial.tab ? (initial.from ?? "") : "");
  const [to, setTo] = useState(initial.tab === "outstation" || !initial.tab ? (initial.to ?? "") : "");
  const [pickupPick, setPickup] = useState<When | null>(null);
  const [retPick, setRet] = useState<When | null>(initial.ret ?? null);
  const pickup = pickupPick ?? start;
  const ret = retPick ?? (pickup ? defaultReturn(pickup) : null);

  // Airport
  const [dir, setDir] = useState<"from" | "to">(initial.dir ?? "from");
  const [aFrom, setAFrom] = useState(initial.tab === "airport" ? (initial.from ?? "") : "");
  const [aTo, setATo] = useState(initial.tab === "airport" ? (initial.to ?? "") : "");
  const [aPick, setAPickup] = useState<When | null>(null);
  const aPickup = aPick ?? start;

  // Hourly
  const [city, setCity] = useState(initial.city ?? "");
  const [slab, setSlab] = useState(initial.slab ?? config.hourly.slabs[0]?.id ?? "");
  const [hPick, setHPickup] = useState<When | null>(null);
  const hPickup = hPick ?? start;

  // Sightseeing
  const [loc, setLoc] = useState(initial.loc ?? "");
  const [days, setDays] = useState(initial.days ? String(initial.days) : "");

  const dropOptions = useMemo(() => {
    const tos = config.outstation.pairs.filter(([f]) => norm(f) === norm(from)).map(([, t]) => t);
    return tos.length ? tos : config.outstation.cities;
  }, [config, from]);
  const areaOptions = (airport: string) => {
    const list = config.airport.pairs.filter(([a]) => norm(a) === norm(airport)).map(([, area]) => area);
    return list.length ? list : config.airport.areas;
  };
  const durations = loc ? (config.sightseeing.locations.find((l) => l.id === loc)?.durations ?? []) : config.sightseeing.durations;

  const go = (search: CabSearch) => {
    setMsg("");
    onSearched?.();
    router.push(searchHref(search));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "sightseeing") {
      onSearched?.();
      router.push(packagesHref(loc, days ? Number(days) : null));
      return;
    }
    if (tab === "outstation") {
      if (!from.trim() || !to.trim()) return setMsg("Please enter the pickup and drop locations.");
      if (norm(from) === norm(to)) return setMsg("Pickup and drop cannot be the same place.");
      if (!pickup || !ret) return;
      const problem = pickupProblem(pickup, "outstation", s) ?? (trip === "round" ? returnProblem(pickup, ret, s) : null);
      if (problem) return setMsg(problem);
      return go({ service: "outstation", trip, from: from.trim(), to: to.trim(), pickup, ret: trip === "round" ? ret : null });
    }
    if (tab === "airport") {
      if (!aFrom.trim() || !aTo.trim()) return setMsg("Please enter where the trip starts and ends.");
      if (!aPickup) return;
      const problem = pickupProblem(aPickup, "airport", s);
      if (problem) return setMsg(problem);
      return go({ service: "airport", dir, from: aFrom.trim(), to: aTo.trim(), pickup: aPickup });
    }
    if (!city.trim()) return setMsg("Please enter the city for your pickup.");
    if (!hPickup) return;
    const problem = pickupProblem(hPickup, "hourly", s);
    if (problem) return setMsg(problem);
    return go({ service: "hourly", city: city.trim(), slab, pickup: hPickup });
  };

  const outOfHours = () => setCallOpen(true);
  const toggle = (on: boolean) =>
    `relative cursor-pointer rounded-full px-4 py-2 font-display text-[0.9rem] font-semibold transition-colors ${on ? "bg-ink text-fog" : "text-moss hover:text-ink"}`;
  const tel = `tel:${s.phone.replace(/[^0-9+]/g, "")}`;

  let fields: React.ReactNode;
  let cols = 3;
  if (tab === "outstation") {
    cols = trip === "round" ? 4 : 3;
    fields = (
      <>
        <CityField label="Pickup location" value={from} onChange={setFrom} options={config.outstation.cities} />
        <CityField label="Drop location" value={to} onChange={setTo} options={dropOptions} />
        <WhenField label="Pickup date & time" value={pickup} onChange={setPickup} service="outstation" settings={s} onOutOfHours={outOfHours} />
        {trip === "round" ? <WhenField label="Return date & time" value={ret} onChange={setRet} service="outstation" settings={s} kind="return" after={pickup ?? undefined} onOutOfHours={outOfHours} /> : null}
      </>
    );
  } else if (tab === "airport") {
    const airportFirst = dir === "from";
    fields = (
      <>
        <CityField
          label={airportFirst ? "From (airport)" : "From"}
          value={aFrom}
          onChange={setAFrom}
          options={airportFirst ? config.airport.airports : areaOptions(aTo)}
          placeholder={airportFirst ? "Choose the airport" : "Type a city"}
        />
        <CityField
          label={airportFirst ? "To" : "To (airport)"}
          value={aTo}
          onChange={setATo}
          options={airportFirst ? areaOptions(aFrom) : config.airport.airports}
          placeholder={airportFirst ? "Type a city" : "Choose the airport"}
        />
        <WhenField label="Trip start date & time" value={aPickup} onChange={setAPickup} service="airport" settings={s} onOutOfHours={outOfHours} />
      </>
    );
  } else if (tab === "hourly") {
    cols = 4;
    fields = (
      <>
        <CityField label="City" value={city} onChange={setCity} options={config.hourly.cities} />
        <WhenField label={["Pickup date", "Pickup time"]} split value={hPickup} onChange={setHPickup} service="hourly" settings={s} onOutOfHours={outOfHours} />
        <ChoiceField label="Package" value={slab} onChange={setSlab} options={config.hourly.slabs.map((h) => ({ value: h.id, label: h.label }))} />
      </>
    );
  } else {
    cols = 2;
    fields = (
      <>
        <ChoiceField
          label="Location"
          value={loc}
          onChange={(v) => {
            setLoc(v);
            setDays("");
          }}
          options={[{ value: "", label: "All locations" }, ...config.sightseeing.locations.map((l) => ({ value: l.id, label: l.name }))]}
        />
        <ChoiceField label="Duration" value={days} onChange={setDays} options={[{ value: "", label: "Any duration" }, ...durations.map((d) => ({ value: String(d), label: `${d} Day${d > 1 ? "s" : ""}` }))]} />
      </>
    );
  }

  return (
    <div ref={root} className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-fog p-2 shadow-[0_30px_80px_-40px_rgb(8_44_41/0.45)] sm:p-3">
      {sticky && inBrowser
        ? createPortal(
            <div
              aria-hidden={!away}
              inert={!away}
              className={`fixed inset-x-0 top-[calc(var(--header-h)+0.5rem+env(safe-area-inset-top,0px))] z-40 flex justify-center px-3 transition-[opacity,translate] duration-500 ease-out-expo md:top-[calc(var(--header-h)+2.5rem)] ${
                away ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
              }`}
            >
              <nav aria-label="Book a cab" className="scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-full border border-fog/10 bg-river-deep/90 p-1.5 shadow-[0_12px_40px_-12px_rgb(8_44_41/0.6)] backdrop-blur-md">
                {TABS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => jumpTo(id)}
                    className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 py-2 font-display text-[0.82rem] font-semibold whitespace-nowrap transition-colors sm:px-4 sm:py-2.5 sm:text-[0.92rem] md:px-6 md:py-3 md:text-[1rem] ${
                      tab === id ? "bg-fog text-ink" : "text-fog hover:bg-fog/15"
                    }`}
                  >
                    {id === "sightseeing" ? <><span className="sm:hidden">Sightseeing</span><span className="hidden sm:inline">{label}</span></> : label}
                  </button>
                ))}
              </nav>
            </div>,
            document.body,
          )
        : null}
      <div role="tablist" aria-label="Booking type" className="grid grid-cols-4 gap-1 rounded-xl bg-cloud p-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setMsg("");
            }}
            className="flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 font-display text-[0.74rem] leading-tight font-semibold text-moss transition-colors hover:text-ink aria-selected:bg-ink aria-selected:text-fog sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-[0.92rem]"
          >
            <Icon className="text-[1.15em] sm:text-[1em]" />
            <span className="text-center sm:whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-3 px-1 pb-1 sm:px-2 sm:pb-2">
        {tab === "outstation" ? (
          <div role="radiogroup" aria-label="Trip type" className="flex gap-1 self-start rounded-full border border-ink/10 p-1">
            {(["oneway", "round"] as const).map((t) => (
              <button key={t} type="button" role="radio" aria-checked={trip === t} onClick={() => setTrip(t)} className={toggle(trip === t)}>
                {t === "oneway" ? "One Way" : "Round Trip"}
              </button>
            ))}
          </div>
        ) : tab === "airport" ? (
          <div role="radiogroup" aria-label="Transfer type" className="flex gap-1 self-start rounded-full border border-ink/10 p-1">
            {(["from", "to"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={dir === d}
                onClick={() => {
                  if (d === dir) return;
                  // Switching direction swaps From and To.
                  setDir(d);
                  setAFrom(aTo);
                  setATo(aFrom);
                }}
                className={toggle(dir === d)}
              >
                {d === "from" ? "Pickup from Airport" : "Drop to Airport"}
              </button>
            ))}
          </div>
        ) : null}

        <div className={`grid gap-2 ${stacked ? "sm:grid-cols-2" : `sm:grid-cols-2 ${cols === 2 ? "lg:grid-cols-[1fr_1fr_auto]" : cols === 3 ? "lg:grid-cols-[1fr_1fr_1.3fr_auto]" : "lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"}`}`}>
          {fields}
          <button
            type="submit"
            className={`group inline-flex min-h-[4.25rem] cursor-pointer items-center justify-center gap-3 rounded-xl bg-mandarin px-6 font-display text-[1.02rem] font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 sm:col-span-2 ${stacked ? "" : "lg:col-span-1"}`}
          >
            {tab === "sightseeing" ? "View packages" : "Search cabs"}
            <span className="grid size-8 place-items-center rounded-full bg-ink text-fog transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5">
              <ArrowRightIcon />
            </span>
          </button>
        </div>

        {msg ? (
          <p role="alert" className="rounded-xl bg-mandarin/15 px-4 py-3 text-[0.92rem] text-ink">
            {msg}
          </p>
        ) : null}
      </form>

      {/* A time outside the cab service hours: ask them to call. */}
      <Drawer open={callOpen} onOpenChange={setCallOpen} title="Please call us for this time">
        <div className="flex flex-col gap-5 p-5 md:p-6" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" }}>
          <p className="leading-relaxed text-ink/80">{serviceHoursMessage(s)}</p>
          <a href={tel} className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-5 py-3.5 font-display font-semibold text-fog transition-transform hover:-translate-y-0.5">
            <PhoneIcon />
            Call {s.phone}
          </a>
        </div>
      </Drawer>
    </div>
  );
}
