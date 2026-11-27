"use client";

/**
 * The one way the booking flow opens anything: a drawer. Phones: it rises from
 * the bottom. Tablet up: it slides in from the right, full height. Radix Dialog
 * gives the focus trap, Esc, scroll lock and outside-click to close. Focus lands
 * on the drawer itself (no ring on the first button), and nothing shows a scrollbar.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { useRef } from "react";
import { ArrowLeftIcon, CrossIcon } from "@/ui/icons";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Back arrow instead of a close cross (e.g. "back to cabs"). */
  back?: () => void;
  /** "full": near full height on phones (long screens like Review booking). */
  tall?: boolean;
  /** Wider on desktop (the search box). */
  wide?: boolean;
  children: React.ReactNode;
};

export function Drawer({ open, onOpenChange, title, back, tall = false, wide = false, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-river-deep/55 backdrop-blur-[2px] motion-safe:animate-[fade-in_0.3s_var(--ease-out-expo)]" />
        <Dialog.Content
          ref={ref}
          tabIndex={-1}
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            ref.current?.focus();
          }}
          className={`fixed inset-x-0 bottom-0 z-[61] flex flex-col overflow-hidden rounded-t-2xl bg-cloud text-ink shadow-[0_-20px_60px_-20px_rgb(8_44_41/0.5)] focus:outline-none motion-safe:animate-[sheet-up_0.45s_var(--ease-out-expo)] md:inset-x-auto md:top-0 md:right-0 md:bottom-0 md:h-auto md:max-h-none md:rounded-none md:rounded-l-2xl md:motion-safe:animate-[sheet-left_0.45s_var(--ease-out-expo)] ${
            tall ? "h-[94dvh]" : "max-h-[90dvh]"
          } ${wide ? "md:w-[min(40rem,100vw)]" : "md:w-[min(32rem,100vw)]"}`}
        >
          {/* Grab handle (phones). */}
          <span aria-hidden="true" className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-ink/15 md:hidden" />
          <div className="flex items-center gap-3 border-b border-ink/10 bg-fog px-4 pt-5 pb-3 md:px-6 md:pt-5">
            {back ? (
              <button type="button" onClick={back} aria-label="Back" className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full transition-colors hover:bg-ink/8">
                <ArrowLeftIcon />
              </button>
            ) : null}
            <Dialog.Title className="flex-1 font-display text-[1.2rem] font-bold tracking-[-0.02em]">{title}</Dialog.Title>
            {back ? null : (
              <Dialog.Close aria-label="Close" className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-ink/8 transition-colors hover:bg-ink hover:text-fog">
                <CrossIcon />
              </Dialog.Close>
            )}
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Scrolling body of a drawer (no visible scrollbar). */
export const DRAWER_BODY = "scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain";
