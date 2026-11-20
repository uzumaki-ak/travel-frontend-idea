"use client";

/**
 * Photo mosaic (desktop) / snap rail (phones) + a full-screen lightbox.
 * Lightbox: Radix Dialog (focus trap, Esc, scroll lock), arrow keys and swipe.
 */
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CrossIcon, GridIcon } from "@/ui/icons";

type Photo = { src: string; alt: string };

const TILE = "group relative block h-full w-full cursor-pointer overflow-hidden bg-cloud focus-visible:outline-offset-[-3px]";
const IMG = "object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.04]";

export function ExperienceGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const show = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const [a, b, c, d] = photos;
  const hidden = photos.length - 4;

  return (
    <section aria-label="Photos" className="pt-10 md:pt-14">
      {/* Phones: swipeable rail with a counter. */}
      <MobileRail photos={photos} onOpen={show} />

      {/* Tablet up: one tall frame, a capsule, and a 2×2 grid. */}
      <div className="wrap hidden md:block">
        <div className="grid h-[min(38vw,560px)] grid-cols-12 grid-rows-2 gap-3">
          {a ? (
            <button type="button" onClick={() => show(0)} className={`${TILE} col-span-6 row-span-2 rounded-tl-[3rem] rounded-br-[3rem]`} aria-label={`Open photo 1: ${a.alt}`}>
              <Image src={a.src} alt="" fill preload sizes="(min-width: 1600px) 800px, 50vw" className={IMG} />
            </button>
          ) : null}
          {b ? (
            <button type="button" onClick={() => show(1)} className={`${TILE} col-span-3 row-span-2 rounded-t-full rounded-b-[2rem]`} aria-label={`Open photo 2: ${b.alt}`}>
              <Image src={b.src} alt="" fill sizes="25vw" className={IMG} />
            </button>
          ) : null}
          {[c, d].map((p, i) =>
            p ? (
              <button key={p.src} type="button" onClick={() => show(i + 2)} className={`${TILE} col-span-3 ${i === 0 ? "rounded-tr-[2rem]" : "rounded-br-[2rem]"} rounded-[0.75rem]`} aria-label={`Open photo ${i + 3}: ${p.alt}`}>
                <Image src={p.src} alt="" fill sizes="25vw" className={IMG} />
                {i === 1 && photos.length > 4 ? (
                  <span className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full bg-fog/90 px-4 py-2 text-[0.85rem] font-medium text-ink backdrop-blur">
                    <GridIcon />
                    {hidden > 0 ? `+${hidden} photos` : `All ${photos.length} photos`}
                  </span>
                ) : null}
              </button>
            ) : null,
          )}
        </div>
      </div>

      <Lightbox photos={photos} title={title} open={open} onOpenChange={setOpen} index={index} setIndex={setIndex} />
    </section>
  );
}

function MobileRail({ photos, onOpen }: { photos: Photo[]; onOpen: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const onScroll = () => {
    const el = ref.current;
    if (el) setCurrent(Math.round(el.scrollLeft / Math.max(1, el.clientWidth * 0.86)));
  };

  return (
    <div className="relative md:hidden">
      <div
        ref={ref}
        onScroll={onScroll}
        className="scrollbar-none relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-(--gutter-x) px-(--gutter-x)"
      >
        {photos.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => onOpen(i)}
            aria-label={`Open photo ${i + 1}: ${p.alt}`}
            className={`relative aspect-[4/5] w-[86%] shrink-0 cursor-pointer snap-start overflow-hidden bg-cloud ${i === 0 ? "rounded-tl-[2.5rem] rounded-br-[2.5rem]" : "rounded-[1.25rem]"}`}
          >
            <Image src={p.src} alt="" fill sizes="86vw" preload={i === 0} className="object-cover" />
          </button>
        ))}
        <div aria-hidden="true" className="w-px shrink-0" />
      </div>
      <span aria-hidden="true" className="absolute top-3 left-[calc(var(--gutter-x)+0.75rem)] rounded-full bg-ink/75 px-3 py-1 font-mono text-[0.75rem] text-fog tabular-nums backdrop-blur">
        {Math.min(current + 1, photos.length)} / {photos.length}
      </span>
    </div>
  );
}

type LightboxProps = {
  photos: Photo[];
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  index: number;
  setIndex: (i: number) => void;
};

function Lightbox({ photos, title, open, onOpenChange, index, setIndex }: LightboxProps) {
  const count = photos.length;
  const go = useCallback((step: number) => setIndex((index + step + count) % count), [index, count, setIndex]);
  const touchX = useRef<number | null>(null);
  const photo = photos[index];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-river-deep/95 backdrop-blur-sm motion-safe:animate-[fade-in_0.3s_var(--ease-out-expo)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[61] flex flex-col text-fog focus:outline-none"
          onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX;
            touchX.current = null;
            if (start == null || end == null || Math.abs(end - start) < 40) return;
            go(end < start ? 1 : -1);
          }}
        >
          <div className="wrap flex items-center justify-between gap-4 py-4">
            <Dialog.Title className="min-w-0 truncate font-display text-[1rem] font-medium">{title}</Dialog.Title>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[0.8rem] text-fog/70 tabular-nums" aria-live="polite">
                {index + 1} / {count}
              </span>
              <Dialog.Close aria-label="Close photos" className="grid size-11 cursor-pointer place-items-center rounded-full bg-white/10 text-xl transition-colors hover:bg-fog hover:text-ink">
                <CrossIcon />
              </Dialog.Close>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            {photo ? (
              <figure key={photo.src} className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-(--gutter-x) pb-4 motion-safe:animate-[fade-in_0.4s_var(--ease-out-expo)]">
                <div className="relative h-full w-full">
                  <Image src={photo.src} alt={photo.alt} fill sizes="100vw" className="object-contain" />
                </div>
                <figcaption className="text-center text-[0.9rem] text-fog/70">{photo.alt}</figcaption>
              </figure>
            ) : null}
            {count > 1 ? (
              <>
                <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className="absolute top-1/2 left-(--gutter-x) hidden size-12 cursor-pointer -translate-y-1/2 place-items-center rounded-full bg-white/10 text-xl transition-colors hover:bg-fog hover:text-ink sm:grid">
                  <ArrowLeftIcon />
                </button>
                <button type="button" aria-label="Next photo" onClick={() => go(1)} className="absolute top-1/2 right-(--gutter-x) hidden size-12 cursor-pointer -translate-y-1/2 place-items-center rounded-full bg-white/10 text-xl transition-colors hover:bg-fog hover:text-ink sm:grid">
                  <ArrowRightIcon />
                </button>
              </>
            ) : null}
          </div>

          {/* Thumbnail strip */}
          <div className="scrollbar-none flex gap-2 overflow-x-auto px-(--gutter-x) pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {photos.map((p, i) => (
              <button
                key={p.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index || undefined}
                className="relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg opacity-50 transition-opacity aria-[current]:opacity-100 aria-[current]:ring-2 aria-[current]:ring-mandarin hover:opacity-90"
              >
                <Image src={p.src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
