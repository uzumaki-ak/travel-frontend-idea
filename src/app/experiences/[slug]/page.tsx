import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { fromPrice, getExperience, getExperienceCards, listExperienceSlugs } from "@/content/experiences";
import type { Experience } from "@/content/experiences/schema";
import { experiencePath } from "@/content/experiences/slugs";
import { home } from "@/content/home";
import { resolveSitePath } from "@/content/routes";
import { EnquiryDialog } from "@/features/enquiry/enquiry-dialog";
import { EnquirySection } from "@/features/enquiry/enquiry-section";
import { ExperienceCard } from "@/features/experiences/experience-card";
import { ExperienceGallery } from "@/features/experiences/experience-gallery";
import { ExperienceHero, PriceTicket } from "@/features/experiences/experience-hero";
import { ExperienceReviews } from "@/features/experiences/experience-reviews";
import { ExperienceFaq, GoodToKnow, Inclusions, KeyFacts, Overview } from "@/features/experiences/experience-sections";
import { PackagePicker } from "@/features/experiences/package-picker";
import { SectionNav, type SectionLink } from "@/features/experiences/section-nav";
import { StickyTicket } from "@/features/experiences/sticky-ticket";
import { TagGroups } from "@/features/experiences/tag-groups";
import { SiteShell } from "@/features/site-chrome/site-shell";
import { JsonLd } from "@/ui/json-ld";
import { Rail } from "@/ui/rail";

export async function generateStaticParams() {
  return listExperienceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/experiences/[slug]">): Promise<Metadata> {
  const experience = await getExperience((await params).slug);
  if (!experience) return {};
  const path = experiencePath(experience.slug);
  return {
    title: experience.seo.title,
    description: experience.seo.description,
    alternates: { canonical: path },
    // Sample content until the admin dashboard publishes real experiences.
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      url: path,
      siteName: siteConfig.name,
      title: experience.seo.title,
      description: experience.seo.description,
      ...(experience.gallery[0] && { images: [{ url: experience.gallery[0].src }] }),
      locale: "en_US",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ExperiencePage({ params }: PageProps<"/experiences/[slug]">) {
  const experience = await getExperience((await params).slug);
  if (!experience) notFound();

  const related = await getExperienceCards(experience.related.filter((s) => s !== experience.slug));
  const crumbs = [
    { label: "Home", href: "/" },
    { label: experience.location.region, href: "/tours/" },
  ];
  const tagGroups = experience.tagGroups.map((g) => ({ title: g.title, links: g.links.map((l) => ({ label: l.label, href: resolveSitePath(l.href) })) }));

  return (
    <SiteShell section="/tours/">
      <ExperienceHero experience={experience} crumbs={crumbs} from={fromPrice(experience)} />
      <ExperienceGallery photos={experience.gallery} title={experience.title} />
      <KeyFacts facts={experience.facts} />
      <SectionNav links={sectionLinks(experience)} />

      {/*
        Price ticket: hidden on phones, shown under the title on tablets; from lg up it is
        pinned in a right-hand column for the whole content (overview → FAQ). The package
        section has its own "Your selection" card, so the ticket steps aside there.
      */}
      <div className="relative">
        <StickyTicket yieldTo="packages" afterId="hero-ticket">
          <PriceTicket from={fromPrice(experience)} packageCount={experience.packages.length} />
        </StickyTicket>

        <div className="wrap py-16 md:py-24 lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-7">
            <Overview experience={experience} />
          </div>
        </div>

        <PackagePicker experienceTitle={experience.title} packages={experience.packages} whatsappHref={home.enquiry.whatsappHref} />

        <div className="wrap py-20 md:py-28 lg:grid lg:grid-cols-12 lg:gap-10">
          <div className="flex min-w-0 flex-col gap-20 md:gap-28 lg:col-span-7">
            <Inclusions includes={experience.includes} excludes={experience.excludes} />
            <GoodToKnow experience={experience} />
            <ExperienceReviews rating={experience.rating} reviews={experience.reviews} />
            <ExperienceFaq faqs={experience.faqs} />
          </div>
        </div>
      </div>

      {related.length ? (
        <section aria-labelledby="related-title" className="flex flex-col gap-10 bg-cloud py-20 md:py-28">
          <div className="wrap">
            <h2 id="related-title" data-motion="lines" className="font-display text-title font-bold tracking-[-0.03em]">
              You might also like
            </h2>
          </div>
          <Rail label="Related experiences">
            {related.map((card) => (
              <div key={card.slug} className="w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-[21rem]">
                <ExperienceCard card={card} sizes="(min-width: 640px) 336px, 78vw" />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      {tagGroups.length ? (
        <div className="wrap py-20 md:py-24">
          <TagGroups groups={tagGroups} />
        </div>
      ) : null}

      {/* The enquiry form opens as a popup from "Book now", "Request to book" and "Send Enquiry". */}
      <EnquiryDialog title="Request to book">
        <EnquirySection title="Request to book" inDialog />
      </EnquiryDialog>

      <JsonLd data={structuredData(experience, crumbs)} />
    </SiteShell>
  );
}

/** Only sections this experience actually has. */
function sectionLinks(e: Experience): SectionLink[] {
  const links: (SectionLink | false)[] = [
    { id: "overview", label: "Overview" },
    { id: "packages", label: "Packages" },
    { id: "itinerary", label: "Itinerary" },
    (e.includes.length > 0 || e.excludes.length > 0) && { id: "included", label: "What’s included" },
    (e.importantInfo.length > 0 || e.notSuitableFor.length > 0 || Boolean(e.meetingPoint)) && { id: "know", label: "Good to know" },
    (e.reviews.length > 0 || e.rating.count > 0) && { id: "reviews", label: "Reviews" },
    e.faqs.length > 0 && { id: "faq", label: "FAQ" },
  ];
  return links.filter((l): l is SectionLink => Boolean(l));
}

/** Breadcrumb + FAQ only. No review/rating markup while reviews are sample content. */
function structuredData(experience: Experience, crumbs: { label: string; href: string }[]) {
  const url = `${siteConfig.url}${experiencePath(experience.slug)}`;
  const graph: object[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [...crumbs.map((c) => ({ name: c.label, item: `${siteConfig.url}${c.href}` })), { name: experience.title, item: url }].map(
        (entry, i) => ({ "@type": "ListItem", position: i + 1, ...entry }),
      ),
    },
  ];
  if (experience.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      url,
      mainEntity: experience.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
