import { siteConfig } from "@/config/site";
import { home } from "@/content/home";
import { EnquirySection } from "@/features/enquiry/enquiry-section";
import { CabServicesSection } from "@/features/home/cab-services-section";
import { DestinationsSection } from "@/features/home/destinations-section";
import { HeroSection } from "@/features/home/hero-section";
import { IntroSection } from "@/features/home/intro-section";
import { DayToursSection, ToursSection } from "@/features/home/tours-section";
import { ContactDock } from "@/features/site-chrome/contact-dock";
import { SiteFooter } from "@/features/site-chrome/site-footer";
import { SiteHeader } from "@/features/site-chrome/site-header";
import { MotionDirector } from "@/motion/motion-director";

/** Organization + WebSite data, matching what the live site publishes. */
function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: `${siteConfig.url}/`,
        logo: `${siteConfig.url}${home.brand.logo}`,
        email: home.contact.email.value,
        telephone: home.contact.call.value,
        sameAs: home.footer.followUs.links.map((l) => l.href),
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: `${siteConfig.url}/`,
        name: siteConfig.name,
        description: home.seo.description,
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here: all values come from our own snapshot.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-full bg-ink px-5 py-3 text-fog focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="content">
        <HeroSection />
        <IntroSection />
        <ToursSection />
        <DayToursSection />
        <DestinationsSection />
        <CabServicesSection />
        <EnquirySection />
      </main>
      <SiteFooter />
      <ContactDock />
      <MotionDirector />
      <StructuredData />
    </>
  );
}
