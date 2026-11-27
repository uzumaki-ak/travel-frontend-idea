/**
 * The /cars/ page's booking sections, under the booking box: popular outstation
 * routes, sightseeing taxi packages, airport transfers and hourly rentals.
 */
import Link from "next/link";
import { getCatalog, packageFrom, slabLabel } from "@/content/cab-booking";
import { formatInr } from "@/features/experiences/format";
import { ArrowUpRightIcon } from "@/ui/icons";
import { Rail } from "@/ui/rail";
import { PackageCard } from "./package-card";
import { PACKAGES_PATH, routeSearchHref } from "./search";

export function CabsOverview() {
  const { routes, transfers, hourly, settings, packages } = getCatalog();
  const minFare = (fares: { fare: number }[]) => Math.min(...fares.map((f) => f.fare));

  return (
    <>
      <section aria-labelledby="routes-title" className="wrap flex flex-col gap-8 pt-20 md:pt-28">
        <h2 id="routes-title" className="font-display text-title font-bold tracking-[-0.03em]">
          Popular outstation routes
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((r) => (
            <li key={r.id}>
              <Link
                href={r.page ? `/cars/${r.page}/` : routeSearchHref(r.from, r.to)}
                className="group flex h-full flex-col gap-4 rounded-xl border border-ink/10 bg-fog p-5 transition-[border-color,translate] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-ink/30"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display text-[1.15rem] font-semibold tracking-[-0.01em]">
                    {r.from} <span className="text-moss">→</span> {r.to}
                  </span>
                  <ArrowUpRightIcon className="shrink-0 transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
                <span className="flex items-end justify-between gap-3 border-t border-ink/10 pt-4">
                  <span className="text-[0.88rem] text-moss">
                    {r.distanceKm} km · {r.duration}
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="text-[0.75rem] text-moss">from</span>
                    <span className="font-mono text-[1.15rem] font-semibold tabular-nums">{formatInr(Math.min(...r.fares.map((f) => f.oneWay)))}</span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {packages.length ? (
        <section aria-labelledby="pk-title" className="flex flex-col gap-8 pt-20 md:pt-28">
          <div className="wrap flex flex-wrap items-end justify-between gap-4">
            <h2 id="pk-title" className="font-display text-title font-bold tracking-[-0.03em]">
              Sightseeing taxi packages
            </h2>
            <Link href={PACKAGES_PATH} className="group inline-flex items-center gap-2 font-display font-semibold underline decoration-mandarin decoration-2 underline-offset-[6px]">
              See all packages
              <span aria-hidden="true" className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
          <Rail label="Sightseeing taxi packages">
            {packages.map((p) => (
              <div key={p.slug} className="w-[72vw] max-w-[18rem] shrink-0 snap-start sm:w-[17.5rem]">
                <PackageCard pkg={p} from={packageFrom(p)} />
              </div>
            ))}
          </Rail>
        </section>
      ) : null}

      <section className="wrap grid gap-16 pt-20 md:pt-28 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-title font-bold tracking-[-0.03em]">Airport transfers</h2>
          <ul className="flex flex-col border-b border-ink/12">
            {transfers.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 border-t border-ink/12 py-4">
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {t.airport} ⇄ {t.area}
                  </span>
                  <span className="text-[0.85rem] text-moss">
                    {t.distanceKm} km · {t.duration}
                  </span>
                </span>
                <span className="font-mono font-semibold tabular-nums">from {formatInr(Math.min(...t.fares.flatMap((f) => [f.pickup, f.drop].filter((n): n is number => !!n))))}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-title font-bold tracking-[-0.03em]">Hourly rentals</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[...hourly]
              .sort((a, b) => a.hours - b.hours)
              .map((h) => (
                <li key={h.id} className="flex flex-col gap-2 rounded-xl bg-cloud p-4">
                  <span className="font-display text-[1.05rem] font-semibold">{slabLabel(h)}</span>
                  <span className="text-[0.85rem] text-moss">
                    from <span className="font-mono font-semibold text-ink tabular-nums">{formatInr(minFare(h.fares))}</span>
                  </span>
                </li>
              ))}
          </ul>
          <p className="text-[0.92rem] text-moss">Available in {settings.hourlyCities.join(" and ")}. Choose the Hourly tab above to see every cab.</p>
        </div>
      </section>
    </>
  );
}
