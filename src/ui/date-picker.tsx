"use client";

/**
 * Date field in the site's own style (no browser-native picker):
 * a button that opens a calendar popover (Radix Popover + react-day-picker,
 * both keyboard and screen-reader accessible). The chosen date is submitted
 * through a hidden input as ISO `YYYY-MM-DD`, so forms read it like any field.
 */
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { bookableRange, isoToLocalDate } from "./business-date";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

type DatePickerProps = {
  id: string;
  name: string;
  placeholder: string;
  /** Allowed range relative to the visitor's today: days from today (min) and years ahead (max). */
  minDaysFromToday?: number;
  maxYearsAhead?: number;
  invalid?: boolean;
  describedBy?: string;
  /** Called when the visitor picks a date, so the parent form can re-validate. */
  onPick?: (iso: string | undefined) => void;
};

const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const display = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", weekday: "short" });

export function DatePicker({ id, name, placeholder, minDaysFromToday = 0, maxYearsAhead = 2, invalid, describedBy, onPick }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date>();
  const [range, setRange] = useState<{ from: Date; to: Date }>();

  const onOpenChange = (next: boolean) => {
    if (next) {
      // Same rule as the server (India time), worked out when the calendar opens.
      const r = bookableRange(minDaysFromToday, maxYearsAhead);
      setRange({ from: isoToLocalDate(r.from), to: isoToLocalDate(r.to) });
    }
    setOpen(next);
  };

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <input type="hidden" name={name} value={selected ? toIso(selected) : ""} />
      <Popover.Trigger
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="flex w-full min-w-0 items-center justify-between gap-3 border-0 border-b border-ink/25 bg-transparent px-0 py-3 text-left text-[1.0625rem] transition-colors focus:outline-none focus-visible:border-b-2 focus-visible:border-mandarin aria-invalid:border-alert data-[state=open]:border-ink"
      >
        <span className={selected ? "text-ink" : "text-moss/60"}>{selected ? display.format(selected) : placeholder}</span>
        <CalendarGlyph />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 rounded-tl-[1.75rem] rounded-br-[1.75rem] bg-ink p-4 text-fog shadow-[0_24px_60px_-20px_rgb(8_44_41/0.6)] motion-safe:animate-[fade-in_0.25s_var(--ease-out-expo)]"
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              setSelected(d);
              setOpen(false);
              onPick?.(d ? toIso(d) : undefined);
            }}
            disabled={range ? [{ before: range.from }, { after: range.to }] : undefined}
            startMonth={range?.from}
            endMonth={range?.to}
            defaultMonth={selected ?? range?.from}
            weekStartsOn={0}
            showOutsideDays={false}
            components={{
              Chevron: ({ orientation }) => (orientation === "left" ? <ArrowLeftIcon /> : <ArrowRightIcon />),
            }}
            classNames={{
              root: "relative font-sans",
              months: "flex flex-col",
              month: "flex flex-col gap-3",
              month_caption: "flex h-9 items-center px-1",
              caption_label: "font-display text-[1.1rem] font-semibold",
              nav: "absolute top-0 right-0 flex gap-1",
              button_previous: "grid size-9 place-items-center rounded-full text-fog/80 hover:bg-white/10 disabled:opacity-25",
              button_next: "grid size-9 place-items-center rounded-full text-fog/80 hover:bg-white/10 disabled:opacity-25",
              month_grid: "border-collapse",
              weekdays: "flex",
              weekday: "label w-10 pb-2 text-center text-jade",
              week: "flex",
              day: "p-0.5",
              day_button:
                "grid size-9 place-items-center rounded-full font-mono text-[0.85rem] tabular-nums transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-mandarin",
              today: "[&>button]:ring-1 [&>button]:ring-jade",
              selected: "[&>button]:bg-mandarin [&>button]:text-ink [&>button]:hover:bg-mandarin",
              disabled: "[&>button]:pointer-events-none [&>button]:opacity-25",
              outside: "invisible",
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function CalendarGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" aria-hidden="true" className="shrink-0 text-moss">
      <path d="M4 6h16v14H4zM4 10h16M8 3.5V7M16 3.5V7" />
    </svg>
  );
}
