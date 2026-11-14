import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { home } from "@/content/home";
import { getTour, listTourSlugs, type Tour } from "@/content/tours";
import { EnquirySection } from "@/features/enquiry/enquiry-section";
import { SiteShell } from "@/features/site-chrome/site-shell";
import { BookingCard } from "@/features/tours/booking-card";
import { Faq, Inclusions, Policies, RelatedTours, Reviews, TourGallery } from "@/features/tours/tour-details";
import { TourHero } from "@/features/tours/tour-hero";
import { MainSectionView } from "@/features/tours/tour-sections";
import { JsonLd } from "@/ui/json-ld";

/** Every live tour is prerendered at build time. */
export async function generateStaticParams() {
  return listTourSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/tours/[slug]">): Promise<Metadata> {
  const tour = await getTour((await params).slug);
  if (!tour) return {};
  // Title and description are the live page's own (Yoast), word for word.
  return {
    title: tour.seo.title,
    description: tour.seo.description,
    alternates: { canonical: tour.url },
    openGraph: {
      type: "article",
      url: tour.url,
      siteName: siteConfig.name,
      title: tour.seo.title,
      description: tour.seo.description,
      ...(tour.seo.ogImage && { images: [{ url: tour.seo.ogImage }] }),
      locale: "en_US",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function TourPage({ params }: PageProps<"/tours/[slug]">) {
  const tour = await getTour((await params).slug);
  if (!tour) notFound();

  const [homeCrumb, toursCrumb] = home.nav;
  const crumbs = [homeCrumb, toursCrumb].filter(Boolean).map((n) => ({ label: n.label, href: n.href }));

  return (
    <SiteShell section="/tours/">
      <TourHero tour={tour} crumbs={crumbs} />
      <TourGallery tour={tour} />

      <div className="wrap grid gap-14 pt-16 pb-24 md:pt-24 lg:grid-cols-12 lg:gap-10">
        {/* Booking card first on phones, sticky beside the content from lg up. */}
        <aside className="lg:sticky lg:top-28 lg:order-2 lg:col-span-4 lg:self-start">
          <BookingCard
            tiers={tour.price.tiers}
            note={tour.price.note}
            enquireLabel={tour.price.enquireLabel || home.enquiry.stickyButtonLabel}
            whatsapp={{ href: home.enquiry.whatsappHref, label: home.contact.whatsapp.label, value: home.contact.whatsapp.value }}
          />
        </aside>

        <div className="flex min-w-0 flex-col gap-14 lg:order-1 lg:col-span-8">
          {tour.main.map((section, i) => (
            <MainSectionView key={`${section.kind}-${i}`} section={section} />
          ))}
        </div>
      </div>

      <div className="wrap flex flex-col gap-20 pb-24 md:gap-28 md:pb-32">
        {tour.inclusions ? <Inclusions data={tour.inclusions} /> : null}
        {tour.policies.length ? <Policies sections={tour.policies} /> : null}
        {tour.reviews ? <Reviews data={tour.reviews} /> : null}
        {tour.faq ? <Faq data={tour.faq} /> : null}
      </div>

      {tour.related?.items.length ? (
        <div className="bg-cloud py-24 md:py-32">
          <RelatedTours data={tour.related} />
        </div>
      ) : null}

      <EnquirySection
        title={tour.enquiry.formTitle || undefined}
        context={{
          tourSlug: tour.slug,
          ...(tour.enquiry.adultsMax && { adultsMax: tour.enquiry.adultsMax }),
          ...(tour.enquiry.childrenMax && { childrenMax: tour.enquiry.childrenMax }),
        }}
      />

      <JsonLd data={structuredData(tour, crumbs)} />
    </SiteShell>
  );
}

/** Breadcrumb + FAQ data, as the live pages publish (Yoast). */
function structuredData(tour: Tour, crumbs: { label: string; href: string }[]) {
  const url = `${siteConfig.url}${tour.url}`;
  const graph: object[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [...crumbs.map((c) => ({ name: c.label, item: `${siteConfig.url}${c.href}` })), { name: tour.title, item: url }].map(
        (entry, i) => ({ "@type": "ListItem", position: i + 1, ...entry }),
      ),
    },
  ];
  if (tour.faq) {
    graph.push({
      "@type": "FAQPage",
      url,
      mainEntity: tour.faq.items.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: { "@type": "Answer", text: q.answer.map((r) => r.text).join("") },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
