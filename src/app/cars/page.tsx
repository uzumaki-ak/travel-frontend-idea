import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { cabIndex } from "@/content/cabs";
import { CabPageView } from "@/features/cabs/cab-page-view";

// Title, description and canonical are the live page's own, byte-exact.
export const metadata: Metadata = {
  title: cabIndex.seo.title,
  description: cabIndex.seo.description,
  alternates: { canonical: cabIndex.seo.canonical },
  openGraph: {
    type: "website",
    url: cabIndex.seo.canonical,
    siteName: siteConfig.name,
    title: cabIndex.seo.title,
    description: cabIndex.seo.description,
    ...(cabIndex.heroImage && { images: [{ url: cabIndex.heroImage }] }),
    locale: "en_US",
  },
};

export default function CabsPage() {
  return <CabPageView page={cabIndex} />;
}
