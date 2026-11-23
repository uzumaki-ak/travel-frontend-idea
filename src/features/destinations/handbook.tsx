"use client";

/**
 * The destination's handbook (travel guide / blog posts): one featured story in
 * a dark band, its photo breaking out of the band's edge, with previous/next and
 * the other stories as a row of picks below. Changing the story is tap-driven only.
 * The posts are not written yet, so nothing links out.
 */
import Image from "next/image";
import { useState } from "react";
import type { Destination } from "@/content/destinations/schema";
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon } from "@/ui/icons";

type Guide = Destination["guides"][number];

export function Handbook({ name, guides }: { name: string; guides: Guide[] }) {
  const [index, setIndex] = useState(0);
  const story = guides[index];
  if (!story) return null;
  const go = (step: number) => setIndex((i) => (i + step + guides.length) % guides.length);

  return (
    <section aria-labelledby="handbook-title" className="pt-24 md:pt-32">
      <div className="wrap pb-10">
        <h2 id="handbook-title" className="font-display text-title font-bold tracking-[-0.03em]">
          {name} handbook
        </h2>
      </div>

      <div className="mx-2 rounded-[1.75rem] bg-river-deep text-fog md:mx-4 md:rounded-[2.75rem]">
        <div className="wrap grid gap-8 pt-6 pb-8 md:pt-14 md:pb-0 lg:grid-cols-12 lg:items-start lg:gap-12">
          {/* The photo: breaks out below the band on desktop. */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-tl-[2.25rem] rounded-br-[2.25rem] bg-river lg:order-2 lg:col-span-7 lg:-mb-20 lg:aspect-[5/4]">
            {guides.map((g, i) => (
              <Image
                key={g.title}
                src={g.image.src}
                alt={i === index ? g.image.alt : ""}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className={`object-cover transition-opacity duration-700 ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5 lg:min-h-[26rem] lg:pt-6 lg:pb-14">
            <span className="flex items-center gap-3 font-mono text-[0.8rem] text-fog/60 tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(guides.length).padStart(2, "0")}
              <span className="rounded-full border border-jade/50 px-3 py-0.5 font-sans text-[0.78rem] font-medium text-jade">{story.tag}</span>
            </span>
            <div aria-live="polite" className="flex flex-col gap-4">
              <h3 className="font-display text-[clamp(1.6rem,3vw,2.6rem)] leading-[1.05] font-bold tracking-[-0.03em]">{story.title}</h3>
              {story.excerpt ? <p className="max-w-[46ch] leading-relaxed text-fog/75">{story.excerpt}</p> : null}
              <span className="inline-flex items-center gap-2 text-[0.85rem] text-fog/60">
                <ClockIcon />
                {story.minutes} min read
              </span>
            </div>
            <div className="mt-auto flex items-center gap-2 pt-2">
              <button type="button" aria-label="Previous story" onClick={() => go(-1)} className="grid size-11 cursor-pointer place-items-center rounded-full border border-fog/30 transition-colors hover:bg-fog hover:text-ink">
                <ArrowLeftIcon />
              </button>
              <button type="button" aria-label="Next story" onClick={() => go(1)} className="grid size-11 cursor-pointer place-items-center rounded-full bg-mandarin text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5">
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Every story, as picks. */}
      <div className="wrap pt-8 lg:pt-28">
        <ul aria-label={`${name} handbook stories`} className="scrollbar-none -mx-(--gutter-x) flex gap-3 overflow-x-auto px-(--gutter-x) lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
          {guides.map((g, i) => (
            <li key={g.title} className="w-[44%] shrink-0 sm:w-[30%] lg:w-auto">
              <button type="button" aria-pressed={i === index} onClick={() => setIndex(i)} className="group flex w-full cursor-pointer flex-col gap-2.5 text-left">
                <span className={`relative block aspect-[4/3] overflow-hidden rounded-[1rem] bg-cloud ring-offset-2 ring-offset-fog transition-shadow ${i === index ? "ring-2 ring-mandarin" : ""}`}>
                  <Image src={g.image.src} alt="" fill sizes="(min-width: 1024px) 14vw, 44vw" className="object-cover" />
                </span>
                <span className={`line-clamp-2 text-[0.85rem] leading-snug font-medium transition-colors ${i === index ? "text-ink" : "text-moss group-hover:text-ink"}`}>{g.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
