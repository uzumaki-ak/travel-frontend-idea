import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { tourArchive } from "@/content/tour-archive";
import { TourArchiveView } from "@/features/tours/tour-archive-view";

// Title, description and canonical are the live page's own (Yoast), byte-exact.
export const metadata: Metadata = {
  title: tourArchive.seo.title,
  description: tourArchive.seo.description,
  alternates: { canonical: tourArchive.seo.canonical },
  openGraph: {
    type: "website",
    url: tourArchive.seo.canonical,
    siteName: siteConfig.name,
    title: tourArchive.seo.title,
    description: tourArchive.seo.description,
    locale: "en_US",
  },
};

export default function ToursPage() {
  return <TourArchiveView />;
}
