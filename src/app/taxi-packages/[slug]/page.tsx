import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cabSettings, getCatalog, locationName, packageBySlug, packageFrom, packageOptions, packageSlugs } from "@/content/cab-booking";
import { durationBadge, PackageCard } from "@/features/cab-booking/package-card";
import { PackageBooking } from "@/features/cab-booking/package-booking";
import { PackageGallery } from "@/features/cab-booking/package-gallery";
import { PACKAGES_PATH, packagePath } from "@/features/cab-booking/search";
import { SiteShell } from "@/features/site-chrome/site-shell";
import { CheckIcon, CrossIcon } from "@/ui/icons";
import { Rail } from "@/ui/rail";

export function generateStaticParams() {
  return packageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/taxi-packages/[slug]">): Promise<Metadata> {
  const p = packageBySlug((await params).slug);
  if (!p) return {};
  return {
    title: `${p.title} Taxi Package`,
    description: p.excerpt,
    alternates: { canonical: packagePath(p.slug) },
    // Design preview until the booking backend is live.
    robots: { index: false, follow: true },
    openGraph: { type: "website", url: packagePath(p.slug), title: p.title, description: p.excerpt, images: [{ url: p.cover }] },
  };
}

/** One sightseeing taxi package: photos, cab choice, about, itinerary, inclusions, booking card, more packages. */
export default async function TaxiPackagePage({ params }: PageProps<"/taxi-packages/[slug]">) {
  const p = packageBySlug((await params).slug);
  if (!p) notFound();

  const options = packageOptions(p);
  const more = getCatalog().packages.filter((o) => o.slug !== p.slug && o.locations.some((l) => p.locations.includes(l)));
  const home = locationName(p.locations[0]!);

  return (
    <SiteShell section="/cars/">
      <div className="wrap flex flex-col gap-8 pt-[calc(var(--header-h)+1.5rem)] md:pt-[calc(var(--header-h)+2.5rem)]">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[0.85rem] text-moss">
            <li className="flex items-center gap-2">
              <Link href="/" className="transition-colors hover:text-ink">
                Home
              </Link>
              <span aria-hidden="true">/</span>
            </li>
            <li className="flex items-center gap-2">
              <Link href={PACKAGES_PATH} className="transition-colors hover:text-ink">
                Taxi packages
              </Link>
              <span aria-hidden="true">/</span>
            </li>
            <li aria-current="page" className="text-ink">
              {p.title}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col gap-4">
          <h1 className="font-display text-[clamp(2.2rem,5vw,4.25rem)] leading-[0.95] font-bold tracking-[-0.04em]">{p.title}</h1>
          <ul className="flex flex-wrap gap-2 text-[0.88rem]">
            <li className="rounded-full bg-ink px-3 py-1 font-mono font-semibold text-fog">{durationBadge(p)}</li>
            <li className="rounded-full border border-ink/15 px-3 py-1">Pickup: {p.start}</li>
            <li className="rounded-full border border-ink/15 px-3 py-1">Drop: {p.end}</li>
          </ul>
        </div>

        <PackageGallery title={p.title} photos={p.gallery.length ? p.gallery : [p.cover]} />

        <div className="pt-4">
          <PackageBooking title={p.title} badge={durationBadge(p)} start={p.start} options={options} settings={cabSettings()}>
            <section aria-labelledby="about-title" className="flex flex-col gap-4">
              <h2 id="about-title" className="font-display text-[1.6rem] font-bold tracking-[-0.02em]">
                About this package
              </h2>
              {p.about.map((t) => (
                <p key={t} className="max-w-[68ch] leading-relaxed text-ink/85">
                  {t}
                </p>
              ))}
              <p className="text-[0.92rem] text-moss">Places covered: {p.places.join(" › ")}</p>
            </section>

            <section aria-labelledby="itin-title" className="flex flex-col gap-4">
              <h2 id="itin-title" className="font-display text-[1.6rem] font-bold tracking-[-0.02em]">
                Itinerary
              </h2>
              <ol className="flex flex-col">
                {p.itinerary.map((d, i) => (
                  <li key={d.title}>
                    <details open={i === 0} className="group border-t border-ink/12 last:border-b">
                      <summary className="flex cursor-pointer list-none items-center gap-4 py-4 [&::-webkit-details-marker]:hidden">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-river font-mono text-[0.8rem] font-semibold text-jade">D{i + 1}</span>
                        <span className="flex-1 font-display text-[1.05rem] font-semibold">{d.title}</span>
                        <span aria-hidden="true" className="relative grid size-8 place-items-center rounded-full border border-ink/20">
                          <span className="absolute h-px w-3 bg-current" />
                          <span className="absolute h-3 w-px bg-current transition-transform duration-300 group-open:rotate-90" />
                        </span>
                      </summary>
                      <p className="max-w-[64ch] pb-5 pl-14 leading-relaxed text-ink/85">{d.text}</p>
                    </details>
                  </li>
                ))}
              </ol>
              <p className="text-[0.88rem] text-moss">Tour ends with drop at {p.end}.</p>
            </section>

            <section className="grid gap-8 sm:grid-cols-2">
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-[1.3rem] font-bold tracking-[-0.02em]">Included</h2>
                <ul className="flex flex-col gap-3">
                  {p.inclusions.map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-jade text-[0.65rem] text-river-deep">
                        <CheckIcon />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-4">
                <h2 className="font-display text-[1.3rem] font-bold tracking-[-0.02em]">Not included</h2>
                <ul className="flex flex-col gap-3">
                  {p.exclusions.map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-mandarin/20 text-[0.65rem] text-mandarin">
                        <CrossIcon />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </PackageBooking>
        </div>
      </div>

      {more.length ? (
        <section aria-labelledby="more-title" className="flex flex-col gap-8 pt-24 pb-24 md:pt-32 md:pb-32">
          <div className="wrap">
            <h2 id="more-title" className="font-display text-title font-bold tracking-[-0.03em]">
              More {home} packages
            </h2>
          </div>
          <Rail label={`More ${home} packages`}>
            {more.map((o) => (
              <div key={o.slug} className="w-[72vw] max-w-[18rem] shrink-0 snap-start sm:w-[17.5rem]">
                <PackageCard pkg={o} from={packageFrom(o)} />
              </div>
            ))}
          </Rail>
        </section>
      ) : (
        <div className="pb-24" />
      )}
    </SiteShell>
  );
}
