"use client";

/**
 * The destination's handbook (travel guide / blog posts): one story at a time in
 * a dark box, text on the left and a smaller photo inside the box on the right,
 * with previous/next to move through them. Tap-driven only.
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
    <section aria-labelledby="handbook-title" className="wrap flex flex-col gap-10 pt-24 md:pt-32">
      <h2 id="handbook-title" className="font-display text-title font-bold tracking-[-0.03em]">
        {name} handbook
      </h2>

      <div className="grid gap-6 rounded-2xl bg-river-deep p-4 text-fog sm:p-6 md:grid-cols-12 md:items-center md:gap-10 md:p-10">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-river md:order-2 md:col-span-5">
          {guides.map((g, i) => (
            <Image
              key={g.title}
              src={g.image.src}
              alt={i === index ? g.image.alt : ""}
              fill
              sizes="(min-width: 768px) 36vw, 100vw"
              className={`object-cover transition-opacity duration-700 ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-5 px-1 pb-1 md:col-span-7 md:px-0 md:pb-0">
          <span className="flex items-center gap-3 font-mono text-[0.8rem] text-fog/60 tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(guides.length).padStart(2, "0")}
            <span className="rounded-full border border-jade/50 px-3 py-0.5 font-sans text-[0.78rem] font-medium text-jade">{story.tag}</span>
          </span>
          <div aria-live="polite" className="flex flex-col gap-3">
            <h3 className="font-display text-[clamp(1.5rem,2.6vw,2.3rem)] leading-[1.08] font-bold tracking-[-0.03em]">{story.title}</h3>
            {story.excerpt ? <p className="max-w-[52ch] leading-relaxed text-fog/75">{story.excerpt}</p> : null}
            <span className="inline-flex items-center gap-2 text-[0.85rem] text-fog/60">
              <ClockIcon />
              {story.minutes} min read
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button type="button" aria-label="Previous story" onClick={() => go(-1)} className="grid size-11 cursor-pointer place-items-center rounded-full border border-fog/30 transition-colors hover:bg-fog hover:text-ink">
              <ArrowLeftIcon />
            </button>
            <button type="button" aria-label="Next story" onClick={() => go(1)} className="grid size-11 cursor-pointer place-items-center rounded-full bg-mandarin text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5">
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
