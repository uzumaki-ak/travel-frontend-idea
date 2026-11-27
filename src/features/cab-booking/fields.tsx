"use client";

/**
 * Fields for the booking box, each a tall box with a small label on top:
 *  - CityField: type to get suggestions (keyboard: ↑ ↓ Enter Esc).
 *  - WhenField: one popover with a calendar and a list of times, or two boxes
 *    ("split") for date and time. Earlier-than-notice and too-far dates are off;
 *    times outside the cab service hours either ask the customer to call (most
 *    services) or are not offered at all (hourly).
 *  - ChoiceField: a dropdown in the same box (our own list, keyboard friendly).
 */
import * as Popover from "@radix-ui/react-popover";
import * as Select from "@radix-ui/react-select";
import { useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { DayPicker } from "react-day-picker";
import type { CabSettings, Service } from "@/content/cab-booking/schema";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon, PhoneIcon } from "@/ui/icons";
import { clock, dateLabel, earliest, lastDate, minutesOf, outsideServiceHours, serviceHoursMessage, timeLabel, timeOf, toWhen, type When } from "./rules";

const BOX =
  "group/field relative flex min-h-[4.25rem] w-full min-w-0 flex-col justify-end rounded-xl border border-ink/12 bg-cloud px-4 pt-6 pb-2.5 text-left transition-colors hover:border-ink/30 focus-within:border-ink data-[state=open]:border-ink";
const LABEL = "pointer-events-none absolute top-2.5 left-4 text-[0.75rem] font-medium text-moss";
const VALUE = "truncate font-display text-[1.02rem] font-semibold tracking-[-0.01em]";

/* ------------------------------------------------------------------ City */

export function CityField({ label, value, onChange, options, placeholder = "Type a city" }: { label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef<number>(0);
  const q = value.trim().toLowerCase();
  const list = useMemo(() => {
    const starts = options.filter((o) => o.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [options, q]);
  const show = open && list.length > 0 && !(list.length === 1 && list[0]!.toLowerCase() === q);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className={BOX}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={show}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={show && active >= 0 ? `${id}-${active}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (!show) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % list.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a <= 0 ? list.length - 1 : a - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(list[active]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`${VALUE} w-full bg-transparent placeholder:font-sans placeholder:text-[0.95rem] placeholder:font-normal placeholder:text-moss/60 focus:outline-none`}
      />
      {show ? (
        <ul id={`${id}-list`} role="listbox" className="absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-ink/10 bg-fog py-1.5 shadow-[0_20px_50px_-20px_rgb(8_44_41/0.45)]">
          {list.map((o, i) => (
            <li
              key={o}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(o)}
              className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-[0.95rem] aria-selected:bg-cloud hover:bg-cloud"
            >
              <PinGlyph />
              {o}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ When */

const STEP = 15;
const DAY_CLASSES = {
  root: "relative font-sans",
  months: "flex flex-col",
  month: "flex flex-col gap-3",
  month_caption: "flex h-9 items-center px-1",
  caption_label: "font-display text-[1.05rem] font-semibold",
  nav: "absolute top-0 right-0 flex gap-1",
  button_previous: "grid size-9 cursor-pointer place-items-center rounded-full text-fog/80 hover:bg-white/10 disabled:opacity-25",
  button_next: "grid size-9 cursor-pointer place-items-center rounded-full text-fog/80 hover:bg-white/10 disabled:opacity-25",
  month_grid: "border-collapse",
  weekdays: "flex",
  weekday: "label w-10 pb-2 text-center text-jade",
  week: "flex",
  day: "p-0.5",
  day_button: "grid size-9 cursor-pointer place-items-center rounded-full font-mono text-[0.85rem] tabular-nums transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-mandarin",
  today: "[&>button]:ring-1 [&>button]:ring-jade",
  selected: "[&>button]:bg-mandarin [&>button]:text-ink [&>button]:hover:bg-mandarin",
  disabled: "[&>button]:pointer-events-none [&>button]:opacity-25",
  outside: "invisible",
};
const toDate = (iso: string) => new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

type WhenProps = {
  label: string | [string, string];
  /** null until the browser knows today's date (first paint shows the default as text). */
  value: When | null;
  onChange: (w: When) => void;
  service: Service;
  settings: CabSettings;
  /** "return" allows 30 more days and starts no earlier than `after`. */
  kind?: "pickup" | "return";
  after?: When;
  split?: boolean;
  /** Ask the customer to call (a time outside service hours was tapped). */
  onOutOfHours: () => void;
};

export function WhenField(props: WhenProps) {
  if (!props.value) return <WhenPlaceholder label={props.label} split={!!props.split} hour={props.settings.defaultPickupHour} />;
  return <WhenPicker {...props} value={props.value} />;
}

function WhenPlaceholder({ label, split, hour }: { label: string | [string, string]; split: boolean; hour: number }) {
  const [dl, tl] = Array.isArray(label) ? label : [label, label];
  const time = timeLabel(timeOf(hour * 60));
  if (split)
    return (
      <>
        <span className={BOX}>
          <span className={LABEL}>{dl}</span>
          <span className={VALUE}>Tomorrow</span>
        </span>
        <span className={BOX}>
          <span className={LABEL}>{tl}</span>
          <span className={VALUE}>{time}</span>
        </span>
      </>
    );
  return (
    <span className={BOX}>
      <span className={LABEL}>{dl}</span>
      <span className={VALUE}>
        Tomorrow <span className="font-sans font-normal text-moss">· {time}</span>
      </span>
    </span>
  );
}

function WhenPicker({ label, value, onChange, service, settings, kind = "pickup", after, split = false, onOutOfHours }: WhenProps & { value: When }) {
  const [open, setOpen] = useState<null | "both" | "date" | "time">(null);
  const now = useNow();
  const openAs = (which: "both" | "date" | "time") => (next: boolean) => setOpen(next ? which : null);

  const first = useMemo(() => {
    const e = toWhen(earliest(settings, now));
    return after && after.date > e.date ? after.date : e.date;
  }, [settings, now, after]);
  const last = lastDate(settings, kind, now);

  // Times for the chosen day, each marked usable / too soon / outside hours.
  const slots = useMemo(() => {
    const min = toWhen(earliest(settings, now));
    const out: { time: string; soon: boolean; night: boolean }[] = [];
    for (let m = 0; m < 1440; m += STEP) {
      const time = timeOf(m);
      const soon = value.date < min.date || (value.date === min.date && minutesOf(time) < minutesOf(min.time)) || (after ? value.date === after.date && minutesOf(time) <= minutesOf(after.time) + 60 : false);
      const night = outsideServiceHours(time, service, settings);
      // Hourly: outside-hours times are simply not offered.
      if (night && service === "hourly") continue;
      out.push({ time, soon, night });
    }
    return out;
  }, [value.date, settings, service, now, after]);

  const pickTime = (s: { time: string; soon: boolean; night: boolean }) => {
    if (s.soon) return;
    if (s.night) {
      setOpen(null);
      onOutOfHours();
      return;
    }
    onChange({ ...value, time: s.time });
    setOpen(null);
  };

  const calendar = (
    <DayPicker
      mode="single"
      selected={toDate(value.date)}
      onSelect={(d) => {
        if (!d) return;
        onChange({ ...value, date: toIso(d) });
        if (split) setOpen(null);
      }}
      disabled={[{ before: toDate(first) }, { after: toDate(last) }]}
      startMonth={toDate(first)}
      endMonth={toDate(last)}
      defaultMonth={toDate(value.date)}
      weekStartsOn={0}
      showOutsideDays={false}
      components={{ Chevron: ({ orientation }) => (orientation === "left" ? <ArrowLeftIcon /> : <ArrowRightIcon />) }}
      classNames={DAY_CLASSES}
    />
  );
  const times = (
    <ul aria-label="Pickup time" className="scrollbar-none flex max-h-[19rem] flex-col gap-1 overflow-y-auto pr-1">
      {slots.map((s) => (
        <li key={s.time}>
          <button
            type="button"
            disabled={s.soon}
            aria-pressed={s.time === value.time}
            onClick={() => pickTime(s)}
            ref={(el) => {
              // Bring the chosen time into view inside the list (never scrolls the page).
              const list = el?.closest("ul");
              if (el && list && s.time === value.time) list.scrollTop = el.offsetTop - list.clientHeight / 2;
            }}
            className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 font-mono text-[0.85rem] tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
              s.time === value.time ? "bg-mandarin text-ink" : s.night ? "text-fog/45 hover:bg-white/5" : "hover:bg-white/10"
            }`}
          >
            {timeLabel(s.time)}
            {s.night && !s.soon ? <PhoneIcon className="text-[0.8em]" /> : null}
          </button>
        </li>
      ))}
    </ul>
  );
  const panel = "z-50 rounded-2xl bg-ink p-4 text-fog shadow-[0_24px_60px_-20px_rgb(8_44_41/0.6)] motion-safe:animate-[fade-in_0.25s_var(--ease-out-expo)]";

  if (split) {
    const [dl, tl] = Array.isArray(label) ? label : [label, label];
    return (
      <>
        <Popover.Root open={open === "date"} onOpenChange={openAs("date")}>
          <Popover.Trigger className={BOX}>
            <span className={LABEL}>{dl}</span>
            <span className={VALUE}>
              {dateLabel(value.date)}
            </span>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content align="start" sideOffset={8} collisionPadding={12} className={panel}>
              {calendar}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <Popover.Root open={open === "time"} onOpenChange={openAs("time")}>
          <Popover.Trigger className={BOX}>
            <span className={LABEL}>{tl}</span>
            <span className={VALUE}>
              {timeLabel(value.time)}
            </span>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content align="start" sideOffset={8} collisionPadding={12} className={`${panel} w-56`}>
              {times}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </>
    );
  }

  return (
    <Popover.Root open={open === "both"} onOpenChange={openAs("both")}>
      <Popover.Trigger className={BOX}>
        <span className={LABEL}>{label as string}</span>
        <span className={VALUE}>
          {dateLabel(value.date)} <span className="font-sans font-normal text-moss">· {timeLabel(value.time)}</span>
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} collisionPadding={12} className={`${panel} flex max-w-[calc(100vw-1.5rem)] flex-col gap-4 sm:flex-row`}>
          {calendar}
          <div className="flex flex-col gap-2 border-t border-white/10 pt-3 sm:w-40 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
            <span className="label text-jade">Time</span>
            {times}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/* ---------------------------------------------------------------- Choice */

/** A dropdown in the same box (our own list, not the browser's). */
export function ChoiceField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  // Radix needs non-empty values; "" (e.g. "All locations") travels as a stand-in.
  const EMPTY = "__any";
  const id = useId();
  return (
    <Select.Root value={value || EMPTY} onValueChange={(v) => onChange(v === EMPTY ? "" : v)}>
      <Select.Trigger id={id} aria-label={label} className={`${BOX} cursor-pointer pr-10`}>
        <span className={LABEL}>{label}</span>
        <span className={VALUE}>
          <Select.Value />
        </span>
        <Select.Icon className="absolute right-4 bottom-4 text-moss">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={8}
          collisionPadding={12}
          className="z-[70] max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-2xl bg-ink p-1.5 text-fog shadow-[0_24px_60px_-20px_rgb(8_44_41/0.6)] motion-safe:animate-[fade-in_0.2s_var(--ease-out-expo)]"
        >
          <Select.Viewport>
            {options.map((o) => (
              <Select.Item
                key={o.value || EMPTY}
                value={o.value || EMPTY}
                className="relative flex cursor-pointer items-center justify-between gap-6 rounded-lg px-4 py-2.5 text-[0.95rem] outline-none select-none data-highlighted:bg-white/10 data-[state=checked]:text-mandarin"
              >
                <Select.ItemText>{o.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <CheckIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

/** The time, refreshed each minute (the server's render uses its own clock). */
const subscribeMinute = (cb: () => void) => {
  const t = window.setInterval(cb, 30_000);
  return () => window.clearInterval(t);
};
const minuteNow = () => Math.floor(clock() / 60_000) * 60_000;
/** 0 while rendering on the server and during hydration (so the HTML never carries a stale date). */
export const useNow = () => useSyncExternalStore(subscribeMinute, minuteNow, () => 0);

/** Small pin used in suggestion lists. */
function PinGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0 fill-moss">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}

export { serviceHoursMessage };
