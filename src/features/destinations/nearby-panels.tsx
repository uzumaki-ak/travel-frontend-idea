"use client";

/**
 * Desktop row of tall photo panels for nearby places. One panel is open (wide,
 * with its line of text); pointing at or tabbing to another opens that one.
 * The first is open to begin with.
 */
import Image from "next/image";
import { useState } from "react";
import type { Destination } from "@/content/destinations/schema";
import { ArrowUpRightIcon } from "@/ui/icons";

export function NearbyPanels({ nearby }: { nearby: Destination["nearby"] }) {
  const [open, setOpen] = useState(0);
  return (
    <ul className="hidden h-[26rem] gap-3 lg:flex xl:h-[28rem]">
      {nearby.map((n, i) => {
        const on = i === open;
        return (
          <li
            key={n.name}
            onMouseEnter={() => setOpen(i)}
            onFocus={() => setOpen(i)}
            className={`relative min-w-0 transition-[flex-grow] duration-700 ease-out-expo ${on ? "flex-[3.2]" : "flex-1"}`}
          >
            <a
              href={n.href}
              className="group absolute inset-0 overflow-hidden rounded-tl-[2.25rem] rounded-br-[2.25rem] rounded-tr-md rounded-bl-md bg-cloud text-fog focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mandarin"
            >
              <Image src={n.image.src} alt={n.image.alt} fill sizes="40vw" className="object-cover" />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-river-deep/85 via-river-deep/15 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="font-display text-[1.35rem] leading-tight font-semibold tracking-[-0.02em]">{n.name}</span>
                  {/* The line folds away on closed panels, so every name sits at the bottom. */}
                  <span className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out-expo ${on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <span className="max-w-[32ch] overflow-hidden text-[0.9rem] text-fog/80">{n.text}</span>
                  </span>
                </span>
                <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-full bg-mandarin text-ink transition-opacity duration-500 ${on ? "opacity-100" : "hidden"}`}>
                  <ArrowUpRightIcon />
                </span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
