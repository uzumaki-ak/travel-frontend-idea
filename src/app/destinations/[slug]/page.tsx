import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getDestination, getHubCabs, listDestinationSlugs } from "@/content/destinations";
import type { Destination } from "@/content/destinations/schema";
import { destinationPath } from "@/content/destinations/slugs";
import { resolveSitePath } from "@/content/routes";
import { experiencePath } from "@/content/experiences/slugs";
import { DestinationHero, type HubStats } from "@/features/destinations/destination-hero";
import { Attractions, FaqWithCallback, GuideCard, HubReviews, Nearby, RouteCard, SectionHead, WhyChoose } from "@/features/destinations/hub-sections";
import { HubBrowser } from "@/features/destinations/hub-browser";
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

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const destination = await getDestination((await params).slug);
  if (!destination) return {};
  const path = destinationPath(destination.slug);
  return {
    title: destination.seo.title,
    description: destination.seo.description,
    alternates: { canonical: path },
    // Sample content until the admin dashboard publishes real tours.
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      url: path,
      siteName: siteConfig.name,
      title: destination.seo.title,
      description: destination.seo.description,
      ...(destination.hero.images[0] && { images: [{ url: destination.hero.images[0].src }] }),
      locale: "en_US",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function DestinationPage({ params }: PageProps<"/destinations/[slug]">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();

  const { name, listings } = destination;
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Tours", href: "/tours/" },
  ];
  const popular = listings.filter((l) => l.popular);
  const cabs = await getHubCabs(destination);
  const stats = hubStats(destination);
  // Short outings (a day or less) are "experiences"; multi-day tours are "itineraries".
  const experiences = listings.filter((l) => l.days === 1);
  const itineraries = listings.filter((l) => l.days > 1).sort((a, b) => a.days - b.days || a.rank - b.rank);
  // Highest rated first, ties broken by how many people rated them.
  const recommended = [...listings].sort((a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count).slice(0, 6);
  const tagGroups = destination.tagGroups.map((g) => ({ title: g.title, links: g.links.map((l) => ({ label: l.label, href: resolveSitePath(l.href) })) }));

  return (
    <SiteShell section="/tours/">
      <DestinationHero destination={destination} crumbs={crumbs} stats={stats} />

      {popular.length ? (
        <section aria-labelledby="popular-title" className="flex flex-col gap-10 pt-24 pb-20 md:pt-32 md:pb-28">
          <SectionHead id="popular-title" title={`Popular ${name} tours`} />
          <Rail label={`Popular ${name} tours`}>
            {popular.map((l) => (
              <div key={l.id} className="w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-[21rem]">
                <TourCard listing={l} sizes="(min-width: 640px) 336px, 78vw" />
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
        <HubBrowser name={name} categories={destination.categories} listings={listings} interlude={destination.interlude} attractions={destination.attractions} cabs={cabs} />
      </section>

      {experiences.length ? (
        <section aria-labelledby="experiences-title" className="flex flex-col gap-10 pt-24 pb-20 md:pt-32 md:pb-28">
          <SectionHead
            id="experiences-title"
            title={`Top ${name} experiences`}
            action={
              <SmoothAnchor href="#tours" className="group inline-flex items-center gap-2 font-display font-semibold underline decoration-mandarin decoration-2 underline-offset-[6px]">
                See all {listings.length} tours
                <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">→</span>
              </SmoothAnchor>
            }
          />
          <Rail label={`Top ${name} experiences`}>
            {experiences.map((l) => (
              <div key={l.id} className="w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-[21rem]">
                <TourCard listing={l} sizes="(min-width: 640px) 336px, 78vw" />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      <Attractions name={name} attractions={destination.attractions} />

      <HubReviews name={name} rating={stats.rating} reviewCount={stats.reviews} reviews={destination.reviews} />

      {itineraries.length ? (
        <section aria-labelledby="itineraries-title" className="flex flex-col gap-10 py-20 md:py-28">
          <SectionHead id="itineraries-title" title={`Best ${name} itineraries`} />
          <Rail label={`${name} itineraries`}>
            {itineraries.map((l) => (
              <div key={l.id} className="w-[82vw] max-w-[23rem] shrink-0 snap-start sm:w-[22.5rem]">
                <RouteCard listing={l} />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

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
              <div key={g.title} className="w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-[21rem]">
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
            <div key={l.id} className="w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-[21rem]">
              <TourCard listing={l} sizes="(min-width: 640px) 336px, 78vw" />
            </div>
          ))}
        </Rail>
      </section>

      <FaqWithCallback name={name} faqs={destination.faqs} callback={destination.callback} />

      <Nearby nearby={destination.nearby} />

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

      <JsonLd data={structuredData(destination, crumbs)} />
    </SiteShell>
  );
}

function hubStats({ listings }: Destination): HubStats {
  const reviews = listings.reduce((n, l) => n + l.rating.count, 0);
  const weighted = reviews ? listings.reduce((n, l) => n + l.rating.average * l.rating.count, 0) / reviews : 0;
  const byDays = [...listings].sort((a, b) => a.days - b.days);
  const cheapest = listings.reduce((a, b) => (b.price.from < a.price.from ? b : a));
  return {
    tours: listings.length,
    rating: weighted,
    reviews,
    minDays: byDays[0]?.days ?? 0,
    maxDays: byDays.at(-1)?.days ?? 0,
    fromPrice: cheapest.price.from,
    fromUnit: cheapest.price.unit,
  };
}

/** Breadcrumb, FAQ and the tour list. No rating markup while tours and reviews are sample content. */
function structuredData(destination: Destination, crumbs: { label: string; href: string }[]) {
  const url = `${siteConfig.url}${destinationPath(destination.slug)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [...crumbs.map((c) => ({ name: c.label, item: `${siteConfig.url}${c.href}` })), { name: destination.name, item: url }].map(
          (entry, i) => ({ "@type": "ListItem", position: i + 1, ...entry }),
        ),
      },
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
