import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getDestination, listDestinationSlugs } from "@/content/destinations";
import { destinationPath, destinationSectionPath } from "@/content/destinations/slugs";
import type { Crumb } from "@/features/destinations/destination-hero";
import { PlacesToVisit } from "@/features/destinations/guide-sections";
import { WhyChoose } from "@/features/destinations/hub-sections";
import { SectionHeader } from "@/features/destinations/section-header";
import { EnquiryDialog } from "@/features/enquiry/enquiry-dialog";
import { EnquirySection } from "@/features/enquiry/enquiry-section";
import { SiteShell } from "@/features/site-chrome/site-shell";

export async function generateStaticParams() {
  return listDestinationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/attractions">): Promise<Metadata> {
  const destination = await getDestination((await params).slug);
  if (!destination) return {};
  const path = destinationSectionPath(destination.slug, "attractions");
  const title = `Places to Visit in ${destination.name}`;
  return {
    title,
    description: destination.seo.description,
    alternates: { canonical: path },
    // Sample content until the admin dashboard publishes real attractions.
    robots: { index: false, follow: true },
    openGraph: { type: "website", url: path, siteName: siteConfig.name, title, description: destination.seo.description, locale: "en_US" },
  };
}

/** A destination's attractions, every place in a staggered grid with its own themes. */
export default async function DestinationAttractionsPage({ params }: PageProps<"/destinations/[slug]/attractions">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();

  const { name, attractions } = destination;
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "India" }, { label: name, href: destinationPath(destination.slug) }];
  const places = new Set(attractions.map((a) => a.place)).size;
  const photos = attractions.slice(0, 2).map((a) => a.image);

  return (
    <SiteShell section="/tours/">
      <SectionHeader
        destination={destination}
        crumbs={crumbs}
        current="attractions"
        title={`Places to visit in ${name}`}
        photos={photos.length ? photos : undefined}
        facts={[
          { value: String(attractions.length), label: "attractions" },
          { value: String(places), label: "towns and areas" },
          { value: String(destination.attractionThemes.length), label: "themes" },
        ]}
      />

      <div className="pb-24 md:pb-32 [&>section]:pt-6 md:[&>section]:pt-8">
        <PlacesToVisit name={name} attractions={attractions} themes={destination.attractionThemes} title={`All ${attractions.length} attractions`} grid />
      </div>

      <WhyChoose why={destination.why} />

      <EnquiryDialog title="Talk to a local expert">
        <EnquirySection title="Talk to a local expert" inDialog />
      </EnquiryDialog>
    </SiteShell>
  );
}
