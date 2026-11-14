import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { archivePageNumbers, tourArchive } from "@/content/tour-archive";
import { TourArchiveView } from "@/features/tours/tour-archive-view";

/**
 * The live site answers /tours/page/2/ … /tours/page/<last>/ with the same
 * listing as /tours/ and a self-referencing canonical; these URLs keep working
 * the same way. Higher numbers 404 (see src/proxy.ts), as on the live site.
 */
export async function generateStaticParams() {
  return archivePageNumbers.map((n) => ({ n: String(n) }));
}

export async function generateMetadata({ params }: PageProps<"/tours/page/[n]">): Promise<Metadata> {
  const { n } = await params;
  const canonical = `/tours/page/${n}/`;
  return {
    title: tourArchive.seo.title,
    description: tourArchive.seo.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: siteConfig.name,
      title: tourArchive.seo.title,
      description: tourArchive.seo.description,
      locale: "en_US",
    },
  };
}

export default async function ToursPagedPage({ params }: PageProps<"/tours/page/[n]">) {
  const { n } = await params;
  if (!archivePageNumbers.includes(Number(n))) notFound();
  return <TourArchiveView />;
}
