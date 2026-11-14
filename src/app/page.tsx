import { siteConfig } from "@/config/site";
import { home } from "@/content/home";
import { EnquirySection } from "@/features/enquiry/enquiry-section";
import { CabServicesSection } from "@/features/home/cab-services-section";
import { DestinationsSection } from "@/features/home/destinations-section";
import { HeroSection } from "@/features/home/hero-section";
import { IntroSection } from "@/features/home/intro-section";
import { DayToursSection, ToursSection } from "@/features/home/tours-section";
import { SiteShell } from "@/features/site-chrome/site-shell";
import { JsonLd } from "@/ui/json-ld";

/** Organization + WebSite data, matching what the live site publishes. */
const structuredData = {
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

export default function HomePage() {
  return (
    <SiteShell>
      <HeroSection />
      <IntroSection />
      <ToursSection />
      <DayToursSection />
      <DestinationsSection />
      <CabServicesSection />
      <EnquirySection />
      <JsonLd data={structuredData} />
    </SiteShell>
  );
}
