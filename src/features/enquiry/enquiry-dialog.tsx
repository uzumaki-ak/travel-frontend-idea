"use client";

/**
 * Shows the enquiry form (passed as children) in a popup instead of a page
 * section. Any same-page link to `#enquiry` opens it: the header's "Send
 * Enquiry", the floating dock, and the package picker's "Book now" / "Request
 * to book". Radix Dialog gives focus trap, Esc to close and scroll lock.
 *
 * The form only mounts once the popup opens, so a prefill (the chosen package)
 * sent on the same click is held here and handed over after it mounts.
 */
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { CrossIcon } from "@/ui/icons";
import { ENQUIRY_PREFILL_EVENT } from "./enquiry-form";

export function EnquiryDialog({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pending = useRef<unknown>(null);
  const replaying = useRef(false);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href, location.href);
      if (url.hash !== "#enquiry" || url.origin !== location.origin || url.pathname !== location.pathname) return;
      e.preventDefault();
      setOpen(true);
    };
    const onPrefill = (e: Event) => {
      if (!replaying.current) pending.current = (e as CustomEvent).detail;
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener(ENQUIRY_PREFILL_EVENT, onPrefill);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(ENQUIRY_PREFILL_EVENT, onPrefill);
    };
  }, []);

  // Hand a held prefill to the form once it has mounted.
  useEffect(() => {
    if (!open || pending.current == null) return;
    const frame = requestAnimationFrame(() => {
      const detail = pending.current;
      pending.current = null;
      replaying.current = true;
      window.dispatchEvent(new CustomEvent(ENQUIRY_PREFILL_EVENT, { detail }));
      replaying.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-river-deep/80 backdrop-blur-sm motion-safe:animate-[fade-in_0.3s_var(--ease-out-expo)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[61] overflow-y-auto overscroll-contain focus:outline-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          // Don't put focus (and its ring) on the close button when the popup opens.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
        >
          {/* Phones: a full-screen sheet. Tablet up: a centred card. */}
          <div className="flex min-h-full justify-center md:items-center md:p-8" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="relative min-h-dvh w-full bg-fog text-ink motion-safe:animate-[fade-in_0.3s_var(--ease-out-expo)] md:min-h-0 md:max-w-[72rem] md:rounded-[1.75rem]">
              <Dialog.Title className="sr-only">{title}</Dialog.Title>
              {/* Phones: a pinned top bar with the heading and close. Tablet up: just the close, in the corner. */}
              <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink/10 bg-fog py-3 pr-3 pl-5 md:absolute md:top-4 md:right-4 md:border-0 md:bg-transparent md:p-0">
                <span aria-hidden="true" className="font-display text-[1.35rem] font-bold tracking-[-0.03em] uppercase md:hidden">
                  {title}
                </span>
                <Dialog.Close
                  aria-label="Close"
                  className="grid size-11 cursor-pointer place-items-center rounded-full bg-ink/8 text-xl transition-colors hover:bg-ink hover:text-fog"
                >
                  <CrossIcon />
                </Dialog.Close>
              </div>
              {children}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
