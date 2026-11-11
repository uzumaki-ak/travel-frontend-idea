import Image from "next/image";
import { resolveSitePath } from "@/config/site";
import type { TourCard as TourCardData } from "@/content/home";
import { ArrowUpRightIcon, ClockIcon } from "@/ui/icons";
import { LEAF } from "@/ui/shape";

type TourCardProps = {
  tour: TourCardData;
  /** `rail`: fixed width inside a horizontal rail. `grid`: fills its grid cell. */
  layout: "rail" | "grid";
  tone?: "light" | "dark";
  /** Pixel width hint for responsive images. */
  sizes: string;
};

export function TourCard({ tour, layout, tone = "light", sizes }: TourCardProps) {
  const dark = tone === "dark";

  return (
    <a
      href={resolveSitePath(tour.href)}
      draggable={false}
      className={`group relative flex flex-col ${layout === "rail" ? "w-[78vw] max-w-[24rem] shrink-0 snap-start sm:w-[21rem]" : "w-full"}`}
    >
      <div className={`relative overflow-clip ${LEAF} ${layout === "rail" ? "aspect-[5/4]" : "aspect-square"} bg-river`}>
        {tour.image ? (
          <Image
            src={tour.image}
            alt=""
            fill
            sizes={sizes}
            draggable={false}
            className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.07]"
          />
        ) : (
          <RippleTile />
        )}
        {tour.duration ? (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-fog/90 px-3 py-1.5 label text-ink backdrop-blur-sm">
            <ClockIcon className="text-[0.85rem]" />
            {tour.duration}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <h3 className="font-display text-[1.3rem] leading-[1.1] font-semibold tracking-[-0.01em] md:text-[1.4rem]">
          {tour.title}
        </h3>
        <ArrowUpRightIcon
          className={`mt-0.5 shrink-0 text-xl transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${dark ? "text-jade" : "text-mandarin"}`}
        />
      </div>

      {tour.price ? (
        <p className={`mt-2 font-mono text-[0.85rem] tabular-nums ${dark ? "text-jade" : "text-moss"}`}>
          <span aria-hidden="true">₹ </span>
          <span className="sr-only">Rupees </span>
          {tour.price}
        </p>
      ) : null}
    </a>
  );
}

/** Shown where the live site has no photo: still water, not a grey placeholder. */
function RippleTile() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[repeating-radial-gradient(circle_at_72%_115%,transparent_0_22px,rgb(147_220_198/0.14)_22px_23px),linear-gradient(160deg,var(--color-river),var(--color-river-deep))] transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.07]"
    />
  );
}
