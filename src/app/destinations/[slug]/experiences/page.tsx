import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getDestination, listDestinationSlugs } from "@/content/destinations";
import { destinationPath, destinationSectionPath } from "@/content/destinations/slugs";
import type { Crumb } from "@/features/destinations/destination-hero";
import { ThingsToDo } from "@/features/destinations/guide-sections";
import { WhyChoose } from "@/features/destinations/hub-sections";
import { SectionHeader } from "@/features/destinations/section-header";
import { EnquiryDialog } from "@/features/enquiry/enquiry-dialog";
import { EnquirySection } from "@/features/enquiry/enquiry-section";
import { formatInr } from "@/features/experiences/format";
import { SiteShell } from "@/features/site-chrome/site-shell";

export async function generateStaticParams() {
  return listDestinationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/experiences">): Promise<Metadata> {
  const destination = await getDestination((await params).slug);
  if (!destination) return {};
  const path = destinationSectionPath(destination.slug, "experiences");
  const title = `Things to Do in ${destination.name}`;
  return {
    title,
    description: destination.seo.description,
    alternates: { canonical: path },
    // Sample content until the admin dashboard publishes real experiences.
    robots: { index: false, follow: true },
    openGraph: { type: "website", url: path, siteName: siteConfig.name, title, description: destination.seo.description, locale: "en_US" },
  };
}

/** A destination's day experiences (things to do), with their own themes. */
export default async function DestinationExperiencesPage({ params }: PageProps<"/destinations/[slug]/experiences">) {
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();

  const { name } = destination;
  const experiences = destination.listings.filter((l) => l.days === 1);
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }, { label: "India" }, { label: name, href: destinationPath(destination.slug) }];
  const cheapest = experiences.length ? Math.min(...experiences.map((l) => l.price.from)) : 0;
  const photos = experiences.slice(0, 2).map((l) => l.images[0]!);

  return (
    <SiteShell section="/tours/">
      <SectionHeader
        destination={destination}
        crumbs={crumbs}
        current="experiences"
        title={`Things to do in ${name}`}
        photos={photos.length ? photos : undefined}
        facts={[
          { value: String(experiences.length), label: "experiences" },
          { value: String(destination.experienceThemes.length), label: "themes" },
          ...(cheapest ? [{ value: formatInr(cheapest), label: "from, per person" }] : []),
        ]}
      />

      <div className="pb-24 md:pb-32 [&>section]:pt-6 md:[&>section]:pt-8">
        <ThingsToDo name={name} experiences={experiences} themes={destination.experienceThemes} title={`All ${experiences.length} experiences`} />
      </div>

      <WhyChoose why={destination.why} />

      <EnquiryDialog title="Talk to a local expert">
        <EnquirySection title="Talk to a local expert" inDialog />
      </EnquiryDialog>
    </SiteShell>
  );
}
