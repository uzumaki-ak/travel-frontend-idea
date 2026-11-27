"use client";

/**
 * Package photos: one large and up to four small, then a full-screen viewer
 * (arrows, keyboard ← →, counter) from any photo or "All photos".
 */
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CrossIcon, GridIcon } from "@/ui/icons";

export function PackageGallery({ title, photos }: { title: string; photos: string[] }) {
  const [at, setAt] = useState<number | null>(null);
  const go = (step: number) => setAt((i) => (i === null ? i : (i + step + photos.length) % photos.length));
  const shown = photos.slice(0, 5);

  return (
    <>
      <div className="relative grid h-[16rem] grid-cols-4 grid-rows-2 gap-2 sm:h-[22rem] md:h-[28rem]">
        {shown.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setAt(i)}
            aria-label={`Open photo ${i + 1} of ${photos.length}`}
            className={`relative cursor-zoom-in overflow-hidden rounded-xl bg-cloud ${i === 0 ? "col-span-4 row-span-2 sm:col-span-2" : "hidden sm:block"}`}
          >
            <Image src={src} alt={i === 0 ? title : ""} fill priority={i === 0} sizes={i === 0 ? "(min-width: 640px) 50vw, 100vw" : "25vw"} className="object-cover transition-[scale] duration-700 ease-out-expo hover:scale-[1.03]" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAt(0)}
          className="absolute right-3 bottom-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-fog/95 px-4 py-2 text-[0.85rem] font-semibold backdrop-blur transition-colors hover:bg-fog"
        >
          <GridIcon />
          All {photos.length} photos
        </button>
      </div>

      <Dialog.Root open={at !== null} onOpenChange={(o) => !o && setAt(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/95" />
          <Dialog.Content
            aria-describedby={undefined}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") go(1);
              if (e.key === "ArrowLeft") go(-1);
            }}
            className="fixed inset-0 z-[81] flex flex-col text-fog focus:outline-none"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <Dialog.Title className="font-mono text-[0.85rem] tabular-nums">{at !== null ? `${at + 1} / ${photos.length}` : ""}</Dialog.Title>
              <Dialog.Close aria-label="Close" className="grid size-10 cursor-pointer place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
                <CrossIcon />
              </Dialog.Close>
            </div>
            <div className="relative flex-1">
              {at !== null ? <Image src={photos[at]!} alt="" fill sizes="100vw" className="object-contain" /> : null}
              <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
                <ArrowLeftIcon />
              </button>
              <button type="button" aria-label="Next photo" onClick={() => go(1)} className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
                <ArrowRightIcon />
              </button>
            </div>
            <div className="scrollbar-none flex justify-center gap-2 overflow-x-auto px-4 py-4">
              {photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  onClick={() => setAt(i)}
                  className={`relative h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg transition-opacity ${i === at ? "ring-2 ring-mandarin" : "opacity-50 hover:opacity-100"}`}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
