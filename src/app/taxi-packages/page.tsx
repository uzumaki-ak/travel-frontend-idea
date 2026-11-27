import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { boxConfig, getCatalog, packageFrom, packageLocations } from "@/content/cab-booking";
import { BookingBox } from "@/features/cab-booking/booking-box";
import { PackageCard } from "@/features/cab-booking/package-card";
import { SiteShell } from "@/features/site-chrome/site-shell";
import { Rail } from "@/ui/rail";

export const metadata: Metadata = {
  title: "Sightseeing Taxi Packages in Meghalaya & Assam",
  description: "Ready-made sightseeing trips with a private cab, priced per cab for the whole trip.",
  // Design preview until the booking backend is live.
  robots: { index: false, follow: true },
};

/** Every taxi package, one swipe row per location. A search (?loc=&days=) puts that location first. */
export default function TaxiPackagesPage({ searchParams }: PageProps<"/taxi-packages">) {
  return (
    <SiteShell section="/cars/">
      <section aria-labelledby="pk-title" className="wrap flex flex-col gap-8 pt-[calc(var(--header-h)+1.5rem)] md:pt-[calc(var(--header-h)+3rem)]">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[0.85rem] text-moss">
            <li className="flex items-center gap-2">
              <Link href="/" className="transition-colors hover:text-ink">
                Home
              </Link>
              <span aria-hidden="true">/</span>
            </li>
            <li aria-current="page" className="text-ink">
              Taxi packages
            </li>
          </ol>
        </nav>
        <h1 id="pk-title" className="font-display text-[clamp(2.6rem,6.5vw,5.75rem)] leading-[0.92] font-bold tracking-[-0.045em]">
          Sightseeing taxi packages
        </h1>
      </section>
      <Suspense fallback={<div className="wrap pt-8"><div className="h-56 animate-pulse rounded-2xl bg-cloud" /></div>}>
        <Rows searchParams={searchParams} />
      </Suspense>
    </SiteShell>
  );
}

async function Rows({ searchParams }: { searchParams: PageProps<"/taxi-packages">["searchParams"] }) {
  const sp = await searchParams;
  const loc = typeof sp.loc === "string" ? sp.loc : "";
  const days = typeof sp.days === "string" ? Number(sp.days) || 0 : 0;
  const { packages } = getCatalog();
  const locations = packageLocations();
  const ordered = loc ? [...locations.filter((l) => l.id === loc), ...locations.filter((l) => l.id !== loc)] : locations;

  return (
    <>
      <div className="wrap pt-8">
        <BookingBox config={boxConfig()} initial={{ tab: "sightseeing", loc, days }} />
      </div>
      <div className="flex flex-col gap-20 pt-20 pb-24 md:gap-24 md:pt-24 md:pb-32">
        {ordered.map((l) => {
          const chosen = l.id === loc && days;
          const list = packages.filter((p) => p.locations.includes(l.id) && (!chosen || p.days === days));
          return (
            <section key={l.id} aria-labelledby={`loc-${l.id}`} className="flex flex-col gap-8">
              <div className="wrap">
                <h2 id={`loc-${l.id}`} className="font-display text-title font-bold tracking-[-0.03em]">
                  {l.name} taxi packages
                </h2>
              </div>
              {list.length ? (
                <Rail label={`${l.name} taxi packages`}>
                  {list.map((p) => (
                    <div key={p.slug} className="w-[72vw] max-w-[18rem] shrink-0 snap-start sm:w-[17.5rem]">
                      <PackageCard pkg={p} from={packageFrom(p)} />
                    </div>
                  ))}
                </Rail>
              ) : (
                <p className="wrap text-moss">No {l.name} packages for that duration yet.</p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
