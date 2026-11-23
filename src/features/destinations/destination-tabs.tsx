/**
 * The destination's five ways in: Overview, Tours, Experiences, Attractions, Cabs.
 * Each is its own page (cabs use the site's cab pages); a section whose page is not
 * open yet still shows, but is not a link. Two looks:
 *  - "glass": a frosted bar over the overview's hero photo;
 *  - "line": underlined tabs in the header of the section pages.
 */
import Link from "next/link";
import type { Destination } from "@/content/destinations/schema";
import { destinationPath, destinationSectionPath, liveDestinationSections, type DestinationSection } from "@/content/destinations/slugs";

export type DestinationTab = "overview" | "tours" | "experiences" | "attractions" | "cabs";

/** Counts for the tabs, from the destination's data. */
export function tabCounts(destination: Destination): Partial<Record<DestinationTab, number>> {
  return {
    tours: destination.listings.length,
    experiences: destination.listings.filter((l) => l.days === 1).length,
    attractions: destination.attractions.length,
    cabs: destination.cabs.length,
  };
}

export function DestinationTabs({
  slug,
  current,
  counts,
  variant,
}: {
  slug: string;
  current: DestinationTab;
  counts: Partial<Record<DestinationTab, number>>;
  variant: "glass" | "line";
}) {
  const section = (s: DestinationSection) => (liveDestinationSections.includes(s) ? destinationSectionPath(slug, s) : null);
  const tabs: { id: DestinationTab; label: string; href: string | null }[] = [
    { id: "overview", label: "Overview", href: destinationPath(slug) },
    { id: "tours", label: "Tours", href: section("tours") },
    { id: "experiences", label: "Experiences", href: section("experiences") },
    { id: "attractions", label: "Attractions", href: section("attractions") },
    { id: "cabs", label: "Cabs", href: "/cars/" },
  ];

  if (variant === "glass") {
    return (
      <nav aria-label="Explore this destination" className="w-full max-w-full">
        <ul className="scrollbar-none mx-auto flex w-max max-w-full gap-1 overflow-x-auto rounded-full border border-fog/25 bg-river-deep/30 p-1.5 backdrop-blur-md">
          {tabs.map((t) => {
            const on = t.id === current;
            return (
              <li key={t.id} className="shrink-0">
                <TabLink
                  href={t.href}
                  on={on}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-display text-[0.92rem] font-semibold transition-colors md:px-6 md:py-3 md:text-[1rem] ${
                    on ? "bg-fog text-ink" : t.href ? "text-fog hover:bg-fog/15" : "cursor-default text-fog"
                  }`}
                >
                  {t.label}
                  {counts[t.id] ? <span className={`font-mono text-[0.72rem] tabular-nums ${on ? "text-moss" : "text-fog/60"}`}>{counts[t.id]}</span> : null}
                </TabLink>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Explore this destination">
      <ul className="scrollbar-none -mx-(--gutter-x) flex gap-7 overflow-x-auto border-b border-ink/12 px-(--gutter-x) md:mx-0 md:gap-9 md:px-0">
        {tabs.map((t) => {
          const on = t.id === current;
          return (
            <li key={t.id} className="shrink-0">
              <TabLink
                href={t.href}
                on={on}
                className={`relative inline-flex items-center gap-2 pt-1 pb-3.5 font-display text-[0.98rem] font-semibold transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:rounded-full after:transition-colors ${
                  on ? "text-ink after:bg-mandarin" : t.href ? "text-moss after:bg-transparent hover:text-ink" : "cursor-default text-moss after:bg-transparent"
                }`}
              >
                {t.label}
                {counts[t.id] ? <span className="font-mono text-[0.72rem] text-moss tabular-nums">{counts[t.id]}</span> : null}
              </TabLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** A tab: a link when its page is open, otherwise the same label as plain (unclickable) text. */
function TabLink({ href, on, className, children }: { href: string | null; on: boolean; className: string; children: React.ReactNode }) {
  if (!href) {
    return (
      <span aria-disabled="true" className={className}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-current={on ? "page" : undefined} className={className}>
      {children}
    </Link>
  );
}
