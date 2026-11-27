import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getDestination, listDestinationSlugs } from "@/content/destinations";
import { destinationPath, destinationSectionPath } from "@/content/destinations/slugs";
import { resolveSitePath } from "@/content/routes";
import { DestinationTabs, tabCounts } from "@/features/destinations/destination-tabs";
import { StickyTabs } from "@/features/destinations/sticky-tabs";
import { hubStats } from "@/features/destinations/hub-stats";
import { ThemedList, type ThemedItem } from "@/features/destinations/themed-list";
import { EnquiryDialog } from "@/features/enquiry/enquiry-dialog";
import { EnquirySection } from "@/features/enquiry/enquiry-section";
import { formatMonthYear, plural } from "@/features/experiences/format";
import { RatingStars } from "@/features/experiences/rating-stars";
import { SiteShell } from "@/features/site-chrome/site-shell";

export async function generateStaticParams() {
  return listDestinationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/reviews">): Promise<Metadata> {
  const destination = await getDestination((await params).slug);
  if (!destination) return {};
  const path = destinationSectionPath(destination.slug, "reviews");
  const title = `${destination.name} Reviews`;
  return {
    title,
    description: `What travellers say about our ${destination.name} tours.`,
    alternates: { canonical: path },
    // Sample reviews until the admin dashboard publishes real ones.
    robots: { index: false, follow: true },
    openGraph: { type: "website", url: path, siteName: siteConfig.name, title, locale: "en_US" },
  };
}

const slugOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Every review for a destination, newest first, with a chip per tour. */
export default async function DestinationReviewsPage({ params }: PageProps<"/destinations/[slug]/reviews">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();

  const { name } = destination;
  const stats = hubStats(destination);
  const reviews = [...destination.reviews].sort((a, b) => b.date.localeCompare(a.date));
  const tours = [...new Set(reviews.map((r) => r.tour))].map((t) => ({ id: slugOf(t), label: t }));

  const items: ThemedItem[] = reviews.map((r) => ({
    key: `${r.name}-${r.date}`,
    themes: [slugOf(r.tour)],
    node: (
      <article className="flex h-full flex-col gap-4 rounded-xl border border-ink/10 bg-cloud p-6">
        <span className="flex items-center justify-between gap-3">
          <RatingStars value={r.rating} className="text-[0.95rem] [&>span:first-child]:text-ink/15" />
          <span className="sr-only">{r.rating} out of 5</span>
          <span className="font-mono text-[0.72rem] text-moss">{formatMonthYear(r.date)}</span>
        </span>
        <p className="flex-1 leading-relaxed text-ink/85">“{r.text}”</p>
        <span className="flex flex-col gap-0.5 border-t border-ink/10 pt-4">
          <span className="font-medium">
            {r.name} <span className="font-normal text-moss">· {r.from}</span>
          </span>
          <span className="truncate text-[0.82rem] text-river">{r.tour}</span>
        </span>
      </article>
    ),
  }));

  return (
    <SiteShell section="/tours/">
      <section aria-labelledby="reviews-title" className="pt-[calc(var(--header-h)+1rem)] pb-10 md:pt-[calc(var(--header-h)+2.5rem)] md:pb-14">
        <div className="wrap flex flex-col gap-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-[0.85rem] text-moss">
              <li className="flex items-center gap-2">
                <a href={resolveSitePath("/")} className="transition-colors hover:text-ink">
                  Home
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li className="flex items-center gap-2">
                <a href={destinationPath(destination.slug)} className="transition-colors hover:text-ink">
                  {name}
                </a>
                <span aria-hidden="true">/</span>
              </li>
              <li aria-current="page" className="text-ink">
                Reviews
              </li>
            </ol>
          </nav>

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h1 id="reviews-title" className="-ml-[0.03em] font-display text-[clamp(2.6rem,7vw,6rem)] leading-[0.9] font-bold tracking-[-0.045em]">
              {name} reviews
            </h1>
            <div className="flex items-end gap-4">
              <span className="font-display text-[clamp(3rem,6vw,4.5rem)] leading-[0.85] font-bold tracking-[-0.04em] tabular-nums">{stats.rating.toFixed(1)}</span>
              <span className="flex flex-col gap-1.5 pb-1">
                <RatingStars value={stats.rating} className="text-[1.05rem] [&>span:first-child]:text-ink/15" />
                <span className="text-[0.9rem] text-moss">{plural(stats.reviews, "review", "reviews")} across our {name} tours</span>
              </span>
            </div>
          </div>

          <StickyTabs floating={<DestinationTabs slug={destination.slug} counts={tabCounts(destination)} variant="float" />}>
            <DestinationTabs slug={destination.slug} counts={tabCounts(destination)} variant="float" />
          </StickyTabs>
        </div>
      </section>

      <div className="pb-24 md:pb-32">
        <ThemedList
          label={`${name} reviews`}
          themes={tours}
          items={items}
          outerClassName="wrap"
          listClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        />
      </div>

      <EnquiryDialog title="Talk to a local expert">
        <EnquirySection title="Talk to a local expert" inDialog />
      </EnquiryDialog>
    </SiteShell>
  );
}
