/**
 * Opener for a destination's own pages (tours, experiences, attractions):
 * breadcrumb, the title, a few numbers, two photos, then the destination's tabs.
 * Compact on purpose; the list below is the point.
 */
import Image from "next/image";
import type { Destination } from "@/content/destinations/schema";
import { resolveSitePath } from "@/content/routes";
import type { Crumb } from "./destination-hero";
import { DestinationTabs, tabCounts, type DestinationTab } from "./destination-tabs";
import { StickyTabs } from "./sticky-tabs";

export type HeaderFact = { value: React.ReactNode; label: string };

export function SectionHeader({
  destination,
  crumbs,
  current,
  title,
  facts,
  photos,
}: {
  destination: Destination;
  crumbs: Crumb[];
  current: Exclude<DestinationTab, "overview" | "cabs">;
  title: string;
  facts: HeaderFact[];
  /** Two photos for the collage; the hero's by default. */
  photos?: { src: string }[];
}) {
  const { hero } = destination;
  const pics = photos ?? [hero.images[1] ?? hero.images[0]!, hero.images[2] ?? hero.images[0]!];
  const [first, second] = [pics[0]!, pics[1] ?? pics[0]!];
  const label = { tours: "Tours", experiences: "Experiences", attractions: "Attractions" }[current];

  return (
    <section aria-labelledby="section-title" className="pt-[calc(var(--header-h)+1rem)] pb-8 md:pt-[calc(var(--header-h)+2.5rem)] md:pb-10">
      <div className="wrap flex flex-col gap-8">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[0.85rem] text-moss">
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                {c.href ? (
                  <a href={resolveSitePath(c.href)} className="transition-colors hover:text-ink">
                    {c.label}
                  </a>
                ) : (
                  <span>{c.label}</span>
                )}
                <span aria-hidden="true">/</span>
              </li>
            ))}
            <li aria-current="page" className="text-ink">
              {label}
            </li>
          </ol>
        </nav>

        <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-8 lg:col-span-7">
            <h1 id="section-title" className="-ml-[0.03em] font-display text-[clamp(2.6rem,7.2vw,6.25rem)] leading-[0.9] font-bold tracking-[-0.045em]">
              {title}
            </h1>
            <dl className="flex flex-wrap gap-x-10 gap-y-5">
              {facts.map((f) => (
                <Fact key={f.label} value={f.value} label={f.label} />
              ))}
            </dl>
          </div>

          {/* Two photos, offset: a quiet collage rather than a second hero. */}
          <div aria-hidden="true" className="relative hidden h-56 lg:col-span-5 lg:block xl:h-64">
            <div className="absolute inset-y-0 right-0 w-[68%] overflow-hidden rounded-xl bg-cloud">
              <Image src={first.src} alt="" fill sizes="(min-width: 1024px) 26vw, 1px" className="object-cover" priority />
            </div>
            <div className="absolute bottom-0 left-0 h-[62%] w-[42%] overflow-hidden rounded-xl border-[6px] border-fog bg-cloud">
              <Image src={second.src} alt="" fill sizes="(min-width: 1024px) 16vw, 1px" className="object-cover" />
            </div>
          </div>
        </div>

        <StickyTabs floating={<DestinationTabs slug={destination.slug} current={current} counts={tabCounts(destination)} variant="float" />}>
          <DestinationTabs slug={destination.slug} current={current} counts={tabCounts(destination)} variant="float" />
        </StickyTabs>
      </div>
    </section>
  );
}

function Fact({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-[clamp(1.5rem,2.4vw,2rem)] leading-none font-bold tracking-[-0.03em] tabular-nums">{value}</dd>
      <dd aria-hidden="true" className="text-[0.85rem] text-moss">
        {label}
      </dd>
    </div>
  );
}
