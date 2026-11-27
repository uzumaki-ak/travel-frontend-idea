/**
 * A sightseeing taxi package as a card: cover, duration badge (2N / 3D),
 * places covered, "Starting from ₹X per cab", View details.
 */
import Image from "next/image";
import Link from "next/link";
import type { TaxiPackage } from "@/content/cab-booking/schema";
import { formatInr } from "@/features/experiences/format";
import { ArrowRightIcon } from "@/ui/icons";
import { packagePath } from "./search";

export const durationBadge = (p: Pick<TaxiPackage, "days" | "nights">) => (p.nights ? `${p.nights}N / ${p.days}D` : `${p.days} Day${p.days > 1 ? "s" : ""}`);

export function PackageCard({ pkg, from, sizes = "(min-width: 640px) 280px, 72vw" }: { pkg: TaxiPackage; from: number; sizes?: string }) {
  return (
    <article className="group relative flex h-full flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-cloud">
        <Image src={pkg.cover} alt="" fill sizes={sizes} className="object-cover transition-[scale] duration-700 ease-out-expo group-hover:scale-[1.04]" />
        <span className="absolute top-3 left-3 rounded-full bg-fog/90 px-3 py-1 font-mono text-[0.75rem] font-semibold backdrop-blur">{durationBadge(pkg)}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <h3 className="font-display text-[1.05rem] leading-snug font-semibold tracking-[-0.01em]">
          <Link href={packagePath(pkg.slug)} className="after:absolute after:inset-0 focus-visible:outline-none group-has-focus-visible:underline">
            {pkg.title}
          </Link>
        </h3>
        <p className="line-clamp-1 text-[0.85rem] text-moss">{pkg.places.join(" › ")}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <span className="flex flex-col">
            <span className="text-[0.72rem] text-moss">Starting from</span>
            <span className="font-mono text-[1.05rem] font-semibold tabular-nums">
              {formatInr(from)} <span className="font-sans text-[0.72rem] font-normal text-moss">per cab</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[0.85rem] font-medium">
            View details
            <ArrowRightIcon className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </article>
  );
}
