import Image from "next/image";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { cabPageBooking, boxConfig, cabSettings, routeCard } from "@/content/cab-booking";
import { type CabBlock, type CabPage } from "@/content/cabs";
import { home } from "@/content/home";
import { resolveSitePath } from "@/content/routes";
import { SiteShell } from "@/features/site-chrome/site-shell";
import { CarIcon, CheckIcon, HeadsetIcon, RupeeCheckIcon, SteeringIcon } from "@/ui/icons";
import { JsonLd } from "@/ui/json-ld";
import { CabBlocks } from "./cab-blocks";
import { BookingBox } from "@/features/cab-booking/booking-box";
import { CabsOverview } from "@/features/cab-booking/cabs-overview";
import { RouteCabs } from "@/features/cab-booking/route-cabs";

const FEATURE_ICONS: Record<string, typeof CheckIcon> = {
  "Clean & Maintained Cars": CarIcon,
  "No Hidden Charges": RupeeCheckIcon,
  "Experienced Drivers": SteeringIcon,
  "Backend Assistance": HeadsetIcon,
};

/** /cars/ and /cars/<slug>/: hero with the booking form, service badges, then the page's own article. */
export function CabPageView({ page }: { page: CabPage }) {
  // The page's own H1 (first level-1 heading) opens the hero; the rest of the article follows in order.
  const titleIndex = page.blocks.findIndex((b) => b.type === "heading" && b.level === 1);
  const title = titleIndex >= 0 ? (page.blocks[titleIndex] as Extract<CabBlock, { type: "heading" }>).text : null;
  const body = page.blocks.filter((_, i) => i !== titleIndex);

  const [homeNav, , cabsNav] = home.nav;
  const crumbs = [homeNav, ...(page.slug && cabsNav ? [cabsNav] : [])].filter(Boolean);

  const booking = cabPageBooking(page.slug);
  const s = cabSettings();

  return (
    <SiteShell section="/cars/">
      <section aria-labelledby={title ? "cab-title" : undefined} className="wrap pt-[calc(var(--header-h)+1.5rem)] md:pt-[calc(var(--header-h)+2.5rem)]">
        {/* Inset "window" (like the homepage panorama) so the header always sits on the light page. */}
        <div className={`relative isolate overflow-clip rounded-tl-[2.5rem] rounded-br-[2.5rem] bg-river-deep px-5 py-10 sm:px-8 md:px-12 md:py-14`}>
        {page.heroImage ? (
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div data-speed="0.12" className="absolute -inset-y-[10%] inset-x-0">
              <Image src={page.heroImage} alt="" fill preload sizes="100vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(8_44_41/0.92)_0%,rgb(8_44_41/0.72)_45%,rgb(8_44_41/0.35)_100%)]" />
          </div>
        ) : null}

        <div className="grid items-end gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="flex flex-col gap-6 text-cloud lg:col-span-12">
            <nav aria-label="Breadcrumb" className="hero-fade [--delay:100ms]">
              <ol className="flex flex-wrap items-center gap-2 label text-cloud/70">
                {crumbs.map((c) => (
                  <li key={c.href} className="flex items-center gap-2">
                    <a href={resolveSitePath(c.href)} className="hover:text-cloud">
                      {c.label}
                    </a>
                    {title ? <span aria-hidden="true">/</span> : null}
                  </li>
                ))}
                {title ? (
                  <li aria-current="page" className="text-cloud">
                    {title}
                  </li>
                ) : null}
              </ol>
            </nav>
            {title ? (
              <h1
                id="cab-title"
                className="hero-line font-display text-[clamp(2.4rem,5.4vw,5.25rem)] leading-[0.95] font-bold tracking-[-0.04em] [font-variation-settings:'opsz'_96]"
              >
                <span>{title}</span>
              </h1>
            ) : null}
          </div>

          {/* The booking box (Outstation, Sightseeing, Airport, Hourly), opened on this page's route. */}
          <div id="enquiry" className="hero-pop scroll-mt-28 text-ink lg:col-span-12 [--delay:250ms]">
            <Suspense fallback={<div className="h-48 rounded-2xl bg-fog/90" />}>
              <BookingBox config={boxConfig()} initial={booking.initial} sticky />
            </Suspense>
          </div>
        </div>
        </div>
      </section>

      {page.features.length ? (
        <section aria-label="Why book with Kajaawa" className="border-b border-ink/10">
          <ul className="wrap grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4 md:py-12">
            {page.features.map((feature) => {
              const Icon = FEATURE_ICONS[feature] ?? CheckIcon;
              return (
                <li key={feature} data-motion="rise" className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-river text-[1.35rem] text-jade">
                    <Icon />
                  </span>
                  <span className="font-display text-[1.05rem] leading-tight font-semibold">{feature}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {booking.route ? (
        <section aria-labelledby="fares-title" className="wrap flex flex-col gap-6 pt-16 md:pt-24">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <h2 id="fares-title" className="font-display text-title font-bold tracking-[-0.03em]">
              {booking.route.from} to {booking.route.to} cab fares
            </h2>
            <p className="rounded-full bg-jade/40 px-4 py-1.5 text-[0.9rem] font-medium text-river-deep">
              {booking.route.distanceKm} km · {booking.route.duration}
            </p>
          </div>
          <RouteCabs from={booking.route.from} to={booking.route.to} quotes={routeCard(booking.route)} freeCancelHours={s.freeCancelHours} />
        </section>
      ) : page.slug ? null : (
        <CabsOverview />
      )}

      <article className="wrap py-16 md:py-24">
        <CabBlocks blocks={body} />
      </article>

      <JsonLd data={structuredData(page, crumbs, title)} />
    </SiteShell>
  );
}

function structuredData(page: CabPage, crumbs: { label: string; href: string }[], title: string | null) {
  const url = `${siteConfig.url}${page.url}`;
  const graph: object[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        ...crumbs.map((c) => ({ name: c.label, item: `${siteConfig.url}${c.href}` })),
        ...(title ? [{ name: title, item: url }] : []),
      ].map((entry, i) => ({ "@type": "ListItem", position: i + 1, ...entry })),
    },
  ];
  const faqs = page.blocks.flatMap((b) => (b.type === "faq" ? b.items : []));
  if (faqs.length) {
    graph.push({
      "@type": "FAQPage",
      url,
      mainEntity: faqs.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: { "@type": "Answer", text: q.answer.map((r) => r.text).join("") },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
