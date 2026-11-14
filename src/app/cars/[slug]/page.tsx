import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/config/site";
import { getCabPage, listCabSlugs } from "@/content/cabs";
import { CabPageView } from "@/features/cabs/cab-page-view";

/** Every live cab page is prerendered at build time. Unknown slugs 404 in src/proxy.ts. */
export async function generateStaticParams() {
  return listCabSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/cars/[slug]">): Promise<Metadata> {
  const page = await getCabPage((await params).slug);
  if (!page) return {};
  return {
    title: page.seo.title,
    description: page.seo.description,
    alternates: { canonical: page.seo.canonical },
    openGraph: {
      type: "article",
      url: page.seo.canonical,
      siteName: siteConfig.name,
      title: page.seo.title,
      description: page.seo.description,
      ...(page.heroImage && { images: [{ url: page.heroImage }] }),
      locale: "en_US",
    },
  };
}

export default async function CabPageRoute({ params }: PageProps<"/cars/[slug]">) {
  const page = await getCabPage((await params).slug);
  if (!page) notFound();
  return <CabPageView page={page} />;
}
