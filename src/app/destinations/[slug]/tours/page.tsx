import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getDestination, listDestinationSlugs } from "@/content/destinations";
import type { Destination } from "@/content/destinations/schema";
import { destinationPath, destinationSectionPath } from "@/content/destinations/slugs";
import { experiencePath } from "@/content/experiences/slugs";
import { resolveSitePath } from "@/content/routes";
import { DestinationHero, type Crumb } from "@/features/destinations/destination-hero";
import { DestinationTabs, tabCounts } from "@/features/destinations/destination-tabs";
import { StickyTabs } from "@/features/destinations/sticky-tabs";
import { HubBrowser } from "@/features/destinations/hub-browser";
import { Attractions, FaqWithCallback, GuideCard, HubReviews, Nearby, SectionHead, WhyChoose } from "@/features/destinations/hub-sections";
import { hubStats, RAIL_ITEM, RAIL_SIZES } from "@/features/destinations/hub-stats";
import { TourCard } from "@/features/destinations/tour-card";
import { TravelInfo } from "@/features/destinations/travel-info";
import { EnquiryDialog } from "@/features/enquiry/enquiry-dialog";
import { EnquirySection } from "@/features/enquiry/enquiry-section";
import { SmoothAnchor } from "@/features/experiences/smooth-anchor";
import { TagGroups } from "@/features/experiences/tag-groups";
import { SiteShell } from "@/features/site-chrome/site-shell";
import { JsonLd } from "@/ui/json-ld";
import { Rail } from "@/ui/rail";

export async function generateStaticParams() {
  return listDestinationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/tours">): Promise<Metadata> {
  const destination = await getDestination((await params).slug);
  if (!destination) return {};
  const path = destinationSectionPath(destination.slug, "tours");
  const title = `${destination.name} Tour Packages`;
  return {
    title,
    description: destination.seo.description,
    alternates: { canonical: path },
    // Sample content until the admin dashboard publishes real tours.
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      url: path,
      siteName: siteConfig.name,
      title,
      description: destination.seo.description,
      ...(destination.hero.images[0] && { images: [{ url: destination.hero.images[0].src }] }),
      locale: "en_US",
    },
    twitter: { card: "summary_large_image" },
  };
}

/**
 * A destination's tour page (the hub the client approved), now one level under
 * the destination page. Content and layout are as approved; the list's filter is
 * tours-only with a desktop sidebar.
 */
export default async function DestinationToursPage({ params }: PageProps<"/destinations/[slug]/tours">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();

  const { name, listings } = destination;
  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: name, href: destinationPath(destination.slug) },
  ];
  const popular = listings.filter((l) => l.popular);
  const stats = hubStats(destination);
  // Short outings (a day or less) are "experiences".
  const experiences = listings.filter((l) => l.days === 1);
  // Highest rated first, ties broken by how many people rated them.
  const recommended = [...listings].sort((a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count).slice(0, 6);
  const tagGroups = destination.tagGroups.map((g) => ({ title: g.title, links: g.links.map((l) => ({ label: l.label, href: resolveSitePath(l.href) })) }));

  return (
    <SiteShell section="/tours/">
      <DestinationHero
        destination={destination}
        crumbs={crumbs}
        stats={stats}
        toursHref="#tours"
        current="Tours"
        tabs={
          // Same glass bar as the destination page; its sticky copy shows from desktop up
          // (smaller screens have the list's own sticky filter bar).
          <StickyTabs desktopOnly floating={<DestinationTabs slug={destination.slug} current="tours" counts={tabCounts(destination)} variant="float" />}>
            <DestinationTabs slug={destination.slug} current="tours" counts={tabCounts(destination)} variant="glass" />
          </StickyTabs>
        }
      />


      {popular.length ? (
        <section aria-labelledby="popular-title" className="flex flex-col gap-10 pt-20 pb-20 md:pt-24 md:pb-28">
          <SectionHead id="popular-title" title={`Popular ${name} tours`} />
          <Rail label={`Popular ${name} tours`}>
            {popular.map((l) => (
              <div key={l.id} className={RAIL_ITEM}>
                <TourCard listing={l} sizes={RAIL_SIZES} />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      <section id="tours" aria-labelledby="tours-title" className="scroll-mt-28 bg-cloud pt-20 pb-24 md:scroll-mt-36 md:pt-28 md:pb-32">
        <div className="wrap pb-8">
          <h2 id="tours-title" className="font-display text-title font-bold tracking-[-0.03em]">
            {name} tour packages
          </h2>
        </div>
        <HubBrowser name={name} categories={destination.categories} listings={listings} interlude={destination.interlude} />
      </section>

      {experiences.length ? (
        <section aria-labelledby="experiences-title" className="flex flex-col gap-10 pt-24 pb-20 md:pt-32 md:pb-28">
          <SectionHead
            id="experiences-title"
            title={`Top ${name} experiences`}
            action={
              <SmoothAnchor href="#tours" className="group inline-flex items-center gap-2 font-display font-semibold underline decoration-mandarin decoration-2 underline-offset-[6px]">
                See all {listings.length} tours
                <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                  →
                </span>
              </SmoothAnchor>
            }
          />
          <Rail label={`Top ${name} experiences`}>
            {experiences.map((l) => (
              <div key={l.id} className={RAIL_ITEM}>
                <TourCard listing={l} sizes={RAIL_SIZES} />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      <Attractions name={name} attractions={destination.attractions} />

      <HubReviews name={name} rating={stats.rating} reviewCount={stats.reviews} reviews={destination.reviews} />

      {destination.info ? (
        <section aria-labelledby="info-title" className="bg-cloud py-20 md:py-28">
          <div className="flex flex-col gap-10">
            <SectionHead id="info-title" title={`Important information about ${name}`} />
            <div className="wrap">
              <TravelInfo name={name} info={destination.info} />
            </div>
          </div>
        </section>
      ) : null}

      {destination.guides.length ? (
        <section aria-labelledby="guides-title" className="flex flex-col gap-10 py-20 md:py-28">
          <SectionHead id="guides-title" title={`${name} travel guide`} />
          <Rail label={`${name} travel guide`}>
            {destination.guides.map((g) => (
              <div key={g.title} className={RAIL_ITEM}>
                <GuideCard guide={g} />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      <section aria-labelledby="recommended-title" className="flex flex-col gap-10 pb-20 md:pb-28">
        <SectionHead id="recommended-title" title={`Recommended ${name} tours`} />
        <Rail label={`Recommended ${name} tours`}>
          {recommended.map((l) => (
            <div key={l.id} className={RAIL_ITEM}>
              <TourCard listing={l} sizes={RAIL_SIZES} />
            </div>
          ))}
        </Rail>
      </section>

      <FaqWithCallback title={`Questions about ${name} tours`} faqs={destination.faqs} callback={destination.callback} />

      <Nearby nearby={destination.nearby} variant="arches" />

      <WhyChoose why={destination.why} />

      {tagGroups.length ? (
        <div className="wrap py-20 md:py-24">
          <TagGroups groups={tagGroups} title={`More from ${name}`} />
        </div>
      ) : null}

      {/* "Talk to a local expert", "Get a callback" and "Send Enquiry" open the enquiry form as a popup. */}
      <EnquiryDialog title="Talk to a local expert">
        <EnquirySection title="Talk to a local expert" inDialog />
      </EnquiryDialog>

      <JsonLd data={structuredData(destination)} />
    </SiteShell>
  );
}

/** Breadcrumb, FAQ and the tour list. No rating markup while tours and reviews are sample content. */
function structuredData(destination: Destination) {
  const url = `${siteConfig.url}${destinationSectionPath(destination.slug, "tours")}`;
  const crumbs = [
    { name: "Home", item: `${siteConfig.url}/` },
    { name: destination.name, item: `${siteConfig.url}${destinationPath(destination.slug)}` },
    { name: "Tours", item: url },
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, ...c })) },
      ...(destination.faqs.length
        ? [
            {
              "@type": "FAQPage",
              url,
              mainEntity: destination.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
            },
          ]
        : []),
      {
        "@type": "ItemList",
        url,
        itemListElement: destination.listings.map((l, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: l.title,
          url: `${siteConfig.url}${experiencePath(l.experience)}`,
        })),
      },
    ],
  };
}
