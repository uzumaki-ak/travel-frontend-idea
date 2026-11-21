"use client";

/**
 * The hub's full filter panel. Phones: a sheet that slides up from the bottom.
 * Tablet up: a panel that slides in from the right. Ticks are a draft until
 * "Show N results"; the count updates live as you tick. Radix Dialog gives focus
 * trap, Esc, scroll lock and outside-click to close.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { CrossIcon } from "@/ui/icons";

export type Kind = "tour" | "experience" | "cab" | "attraction";
export type Duration = "day" | "short" | "long";
export type Filters = { types: Kind[]; themes: string[]; durations: Duration[] };
export type Option<T extends string> = { id: T; label: string; count: number };

export const EMPTY: Filters = { types: [], themes: [], durations: [] };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applied: Filters;
  types: Option<Kind>[];
  themes: Option<string>[];
  durations: Option<Duration>[];
  /** How many results a set of filters would give. */
  countFor: (f: Filters) => number;
  onApply: (f: Filters) => void;
};

export function FilterSheet({ open, onOpenChange, ...rest }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-river-deep/55 backdrop-blur-[2px] motion-safe:animate-[fade-in_0.3s_var(--ease-out-expo)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[88dvh] flex-col rounded-t-[1.75rem] bg-fog text-ink shadow-[0_-20px_60px_-20px_rgb(8_44_41/0.5)] focus:outline-none motion-safe:animate-[sheet-up_0.45s_var(--ease-out-expo)] md:inset-x-auto md:top-0 md:right-0 md:bottom-0 md:max-h-none md:w-[27rem] md:rounded-none md:rounded-l-[1.75rem] md:motion-safe:animate-[sheet-left_0.45s_var(--ease-out-expo)]"
        >
          {/* Mounted only while open, so the draft starts from the applied filters each time. */}
          <Panel {...rest} onClose={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Panel({ applied, types, themes, durations, countFor, onApply, onClose }: Omit<Props, "open" | "onOpenChange"> & { onClose: () => void }) {
  const [draft, setDraft] = useState<Filters>(applied);
  const toggle = <K extends keyof Filters>(key: K, id: Filters[K][number]) =>
    setDraft((d) => {
      const list = d[key] as string[];
      return { ...d, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] };
    });
  const count = countFor(draft);

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-6 pt-3 pb-4 md:pt-6">
        {/* Grab handle (phones). */}
        <span aria-hidden="true" className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-ink/15 md:hidden" />
        <Dialog.Title className="pt-3 font-display text-[1.35rem] font-bold tracking-[-0.02em] md:pt-0">Filters</Dialog.Title>
        <Dialog.Close aria-label="Close filters" className="mt-3 grid size-10 cursor-pointer place-items-center rounded-full bg-ink/8 text-lg transition-colors hover:bg-ink hover:text-fog md:mt-0">
          <CrossIcon />
        </Dialog.Close>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-6">
        <Group title="Type" options={types} picked={draft.types} onToggle={(id) => toggle("types", id)} />
        <Group title="Themes" options={themes} picked={draft.themes} onToggle={(id) => toggle("themes", id)} />
        <Group title="Duration" options={durations} picked={draft.durations} onToggle={(id) => toggle("durations", id)} last />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-ink/10 px-6 py-4" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}>
        <button type="button" onClick={() => setDraft({ types: [], themes: [], durations: [] })} className="cursor-pointer font-display font-semibold underline underline-offset-4 transition-colors hover:text-mandarin">
          Clear all
        </button>
        <button
          type="button"
          disabled={count === 0}
          onClick={() => {
            onApply(draft);
            onClose();
          }}
          className="cursor-pointer rounded-full bg-mandarin px-6 py-3 font-display font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          {count === 0 ? "No results" : `Show ${count} ${count === 1 ? "result" : "results"}`}
        </button>
      </div>
    </>
  );
}

function Group<T extends string>({ title, options, picked, onToggle, last = false }: { title: string; options: Option<T>[]; picked: T[]; onToggle: (id: T) => void; last?: boolean }) {
  return (
    <fieldset className={`py-5 ${last ? "" : "border-b border-ink/10"}`}>
      <legend className="float-left mb-2 w-full font-display text-[1.05rem] font-semibold">{title}</legend>
      <div className="clear-left flex flex-col">
        {options.map((o) => (
          <label key={o.id} className="flex cursor-pointer items-center justify-between gap-4 py-2.5">
            <span className="flex items-center gap-3">
              <input type="checkbox" checked={picked.includes(o.id)} onChange={() => onToggle(o.id)} className="peer sr-only" />
              <span
                aria-hidden="true"
                className="grid size-5 place-items-center rounded-md border border-ink/30 text-[0.7rem] text-transparent transition-colors peer-checked:border-ink peer-checked:bg-ink peer-checked:text-fog peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-mandarin"
              >
                ✓
              </span>
              <span className="text-[0.98rem]">{o.label}</span>
            </span>
            <span className="font-mono text-[0.75rem] text-moss tabular-nums">{o.count}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
