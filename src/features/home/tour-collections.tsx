"use client";

/**
 * The homepage has five overlapping package lists. They become one tabbed
 * block (accessible Radix Tabs). Every panel stays in the HTML — inactive ones
 * are `hidden` — so all links and titles remain crawlable, word for word.
 */
import * as Tabs from "@radix-ui/react-tabs";
import { useState } from "react";
import type { TourCollection } from "@/content/home";
import { TourCard } from "./tour-card";
import { TourRail } from "./tour-rail";

const RAIL_IMAGE_SIZES = "(min-width: 640px) 336px, 78vw";

export function TourCollections({ collections }: { collections: TourCollection[] }) {
  const [active, setActive] = useState(collections[0]?.title ?? "");

  return (
    <Tabs.Root value={active} onValueChange={setActive} className="flex flex-col gap-12">
      <div className="wrap">
        <Tabs.List
          aria-label="Tour packages"
          className="scrollbar-none -mx-2 flex gap-1 overflow-x-auto px-2 pb-1 md:flex-wrap md:gap-2"
        >
          {collections.map((collection) => (
            <Tabs.Trigger
              key={collection.title}
              value={collection.title}
              className="shrink-0 rounded-full px-4 py-2.5 font-display text-[1.05rem] font-medium whitespace-nowrap text-moss transition-colors hover:text-ink data-[state=active]:bg-ink data-[state=active]:text-fog md:px-5 md:text-[1.2rem]"
            >
              {collection.title}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </div>

      {collections.map((collection) => (
        <Tabs.Content
          key={collection.title}
          value={collection.title}
          forceMount
          hidden={collection.title !== active}
          className="outline-none focus-visible:outline-none"
        >
          <h2 className="sr-only">{collection.title}</h2>
          <TourRail label={collection.title}>
            {collection.items.map((tour) => (
              <TourCard key={tour.href} tour={tour} layout="rail" sizes={RAIL_IMAGE_SIZES} />
            ))}
          </TourRail>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
