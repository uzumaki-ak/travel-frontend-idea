import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getDestination, getHubCabs, listDestinationSlugs } from "@/content/destinations";
import type { Destination } from "@/content/destinations/schema";
import { destinationPath, destinationSectionPath } from "@/content/destinations/slugs";
import { resolveSitePath } from "@/content/routes";
import type { Crumb } from "@/features/destinations/destination-hero";
import { ExploreWays, type Way } from "@/features/destinations/explore-ways";
import { GoodToKnow, GuideHero, MustVisit, PlacesToVisit, ThingsToDo } from "@/features/destinations/guide-sections";
import { Handbook } from "@/features/destinations/handbook";
import { FaqWithCallback, HubReviews, Nearby, SectionHead, WhyChoose } from "@/features/destinations/hub-sections";
import { hubStats, RAIL_ITEM, RAIL_SIZES } from "@/features/destinations/hub-stats";
import { CabCard } from "@/features/destinations/result-cards";
import { ThemedList } from "@/features/destinations/themed-list";
import { TourCard } from "@/features/destinations/tour-card";
import { TravelInfo } from "@/features/destinations/travel-info";
import { EnquiryDialog } from "@/features/enquiry/enquiry-dialog";
import { EnquirySection } from "@/features/enquiry/enquiry-section";
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

/**
 * The destination page: everything about the place, with a way into each kind of
 * thing to book. Tours have their own page (/destinations/<slug>/tours/) and cabs
 * open the site's cab pages. Experiences and attractions are sections here until
 * their own detailed pages are ready.
 */
export default async function DestinationPage({ params }: PageProps<"/destinations/[slug]">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();

  const { name, listings, attractions } = destination;
  const toursHref = destinationSectionPath(destination.slug, "tours");
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "India" }];
  const stats = hubStats(destination);
  const cabs = await getHubCabs(destination);
  // Short outings (a day) are "things to do".
  const experiences = listings.filter((l) => l.days === 1);
  const popular = listings.filter((l) => l.popular);
  const tagGroups = destination.tagGroups.map((g) => ({ title: g.title, links: g.links.map((l) => ({ label: l.label, href: resolveSitePath(l.href) })) }));

  const ways: Way[] = [
    { label: `${name} tours`, count: listings.length, unit: "packages, a day to a week", href: toursHref, image: destination.hero.images[0]! },
    ...(experiences.length ? [{ label: "Things to do", count: experiences.length, unit: "day experiences", href: "#things-to-do", image: experiences[0]!.images[0]! }] : []),
    ...(attractions.length ? [{ label: "Attractions", count: attractions.length, unit: "places to see", href: "#attractions", image: attractions[0]!.image }] : []),
    ...(cabs.length ? [{ label: "Cabs", count: cabs.length, unit: "routes with drivers", href: "/cars/", image: cabs[0]!.image }] : []),
  ];

  const seeAll = (href: string, label: string) => (
    <Link href={href} className="group inline-flex items-center gap-2 font-display font-semibold underline decoration-mandarin decoration-2 underline-offset-[6px]">
      {label}
      <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
        →
      </span>
    </Link>
  );

  return (
    <SiteShell section="/tours/">
      <GuideHero destination={destination} crumbs={crumbs} />

      <MustVisit destination={destination} />

      <ExploreWays name={name} ways={ways} />

      {popular.length ? (
        <section aria-labelledby="popular-title" className="flex flex-col gap-8 pt-24 md:pt-32">
          <SectionHead id="popular-title" title={`${name}'s most popular tours`} action={seeAll(toursHref, `See all ${listings.length} tours`)} />
          <Rail label={`${name}'s most popular tours`}>
            {popular.map((l) => (
              <div key={l.id} className={RAIL_ITEM}>
                <TourCard listing={l} sizes={RAIL_SIZES} />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      <PlacesToVisit name={name} attractions={attractions} themes={destination.attractionThemes} />

      <ThingsToDo name={name} experiences={experiences} themes={destination.experienceThemes} />

      {/* One pale band: facts, then the practical information. */}
      <GoodToKnow name={name} facts={destination.facts} />
      {destination.info ? (
        <section aria-labelledby="info-title" className={`bg-cloud pb-20 md:pb-28 ${destination.facts.length ? "" : "pt-20 md:pt-28"}`}>
          <div className="flex flex-col gap-10">
            <SectionHead id="info-title" title="Essential travel information" />
            <div className="wrap">
              <TravelInfo name={name} info={destination.info} />
            </div>
          </div>
        </section>
      ) : null}

      <Handbook name={name} guides={destination.guides} />

      {cabs.length ? (
        <section id="cabs" aria-labelledby="cabs-title" className="flex scroll-mt-28 flex-col gap-8 py-24 md:scroll-mt-36 md:py-32">
          <SectionHead id="cabs-title" title={`Cabs in ${name}`} action={seeAll("/cars/", "All cab routes")} />
          <ThemedList
            rail
            label={`Cabs in ${name}`}
            themes={destination.cabThemes}
            itemClassName={RAIL_ITEM}
            items={cabs.map((c) => ({ key: c.slug, themes: c.themes, node: <CabCard cab={c} tall /> }))}
          />
        </section>
      ) : null}

      <HubReviews name={name} rating={stats.rating} reviewCount={stats.reviews} reviews={destination.reviews} />

      <FaqWithCallback title={`Questions about ${name}`} faqs={destination.faqs} callback={destination.callback} />

      <Nearby nearby={destination.nearby} title="Popular related destinations" />

      <WhyChoose why={destination.why} />

      {tagGroups.length ? (
        <div className="wrap py-20 md:py-24">
          <TagGroups groups={tagGroups} title={`Explore ${name}`} />
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

/** Breadcrumb and FAQ. No rating markup while tours and reviews are sample content. */
function structuredData(destination: Destination) {
  const url = `${siteConfig.url}${destinationPath(destination.slug)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: "Home", item: `${siteConfig.url}/` },
          { name: destination.name, item: url },
        ].map((entry, i) => ({ "@type": "ListItem", position: i + 1, ...entry })),
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
      { "@type": "TouristDestination", name: destination.name, url, description: destination.seo.description },
    ],
  };
}
