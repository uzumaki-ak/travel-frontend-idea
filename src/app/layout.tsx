import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Martian_Mono, Schibsted_Grotesk } from "next/font/google";
import { siteConfig } from "@/config/site";
import { home } from "@/content/home";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-bricolage",
  display: "swap",
});

const body = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

const mono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  display: "swap",
  preload: false, // labels only; never on the critical path
});

// Title and description are the live page's own, word for word.
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: home.seo.title,
  description: home.seo.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: home.seo.title,
    description: home.seo.description,
    images: [{ url: home.hero.src, width: home.hero.width, height: home.hero.height, alt: home.hero.alt }],
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  themeColor: "#e2e8e4",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
