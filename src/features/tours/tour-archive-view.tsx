import { resolveSitePath } from "@/content/routes";
import { tourArchive } from "@/content/tour-archive";
import { SiteShell } from "@/features/site-chrome/site-shell";
import { ArchiveCard } from "./archive-card";
import { ArchiveGrid } from "./archive-grid";

/** "Our Tours" listing — shared by /tours/ and the /tours/page/<n>/ URLs (which repeat it, as on the live site). */
export function TourArchiveView() {
  const { heading, cards, perPage, loadMoreLabel } = tourArchive;

  return (
    <SiteShell section="/tours/">
      <section className="wrap pt-[calc(var(--header-h)+3rem)] pb-24 md:pt-[calc(var(--header-h)+5rem)] md:pb-32">
        <div className="relative mb-14 md:mb-20">
          <div
            aria-hidden="true"
            className="hero-fade pointer-events-none absolute -top-10 right-0 hidden aspect-square w-[min(36vw,420px)] overflow-clip rounded-full [--delay:200ms] md:block"
          >
            <div className="hero-orbit absolute inset-0 rounded-full border border-dashed border-ink/12 before:absolute before:inset-[12%] before:rounded-full before:border before:border-ink/8 after:absolute after:inset-[26%] after:rounded-full after:border after:border-ink/6">
              <span className="absolute top-[14.6%] left-[14.6%] size-2.5 -translate-1/2 rounded-full bg-mandarin" />
            </div>
          </div>
          <h1 className="hero-line relative font-display text-hero font-bold tracking-[-0.045em] uppercase [font-variation-settings:'opsz'_96]">
            <span>{heading}</span>
          </h1>
        </div>

        <ArchiveGrid
          perPage={perPage}
          loadMoreLabel={loadMoreLabel}
          cards={cards.map((card) => (
            <ArchiveCard key={card.href} card={card} href={resolveSitePath(card.href)} />
          ))}
        />
      </section>
    </SiteShell>
  );
}
