/**
 * The destination page's four ways in: tours (its own page), things to do,
 * attractions and cabs (sections further down). One big tile and three smaller
 * ones, each a photo with its count set large.
 */
import Image from "next/image";
import Link from "next/link";
import { SmoothAnchor } from "@/features/experiences/smooth-anchor";
import { ArrowUpRightIcon } from "@/ui/icons";

export type Way = { label: string; count: number; unit: string; href: string; image: { src: string; alt: string } };

export function ExploreWays({ name, ways }: { name: string; ways: Way[] }) {
  if (!ways.length) return null;
  return (
    <section aria-labelledby="ways-title" className="wrap flex flex-col gap-8 pt-20 md:gap-10 md:pt-28">
      <h2 id="ways-title" className="font-display text-title font-bold tracking-[-0.03em]">
        Explore {name} your way
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-12 md:grid-rows-2 md:gap-4">
        {ways.map((w, i) => (
          <li
            key={w.label}
            className={
              i === 0
                ? "col-span-2 md:col-span-6 md:row-span-2"
                : i === 1
                  ? "col-span-2 md:col-span-6"
                  : "md:col-span-3"
            }
          >
            <Tile way={w} big={i === 0} wide={i === 1} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Tile({ way, big, wide }: { way: Way; big: boolean; wide: boolean }) {
  const inner = (
    <>
      <Image
        src={way.image.src}
        alt={way.image.alt}
        fill
        sizes={big || wide ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
        className="object-cover transition-[scale] duration-[1.2s] ease-out-expo group-hover:scale-[1.05]"
      />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-river-deep/90 via-river-deep/25 to-transparent" />
      <span className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-fog/90 text-ink backdrop-blur transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:top-5 md:right-5">
        <ArrowUpRightIcon />
      </span>
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 text-fog md:p-6">
        <span className={`font-display leading-[0.9] font-bold tracking-[-0.04em] tabular-nums ${big ? "text-[clamp(3.5rem,8vw,7rem)]" : "text-[clamp(2.25rem,4vw,3.25rem)]"}`}>{way.count}</span>
        <span className={`font-display font-semibold tracking-[-0.01em] ${big ? "text-[clamp(1.25rem,2vw,1.6rem)]" : "text-[1.05rem]"}`}>{way.label}</span>
        <span className="text-[0.82rem] text-fog/70">{way.unit}</span>
      </span>
    </>
  );
  const shape = big
    ? "aspect-[4/3] md:aspect-auto md:h-full md:min-h-[30rem] rounded-tl-[2.75rem] rounded-br-[2.75rem] rounded-tr-lg rounded-bl-lg"
    : wide
      ? "aspect-[16/9] md:aspect-auto md:h-full rounded-tr-[2.25rem] rounded-bl-[2.25rem] rounded-tl-lg rounded-br-lg"
      : "aspect-[4/5] md:aspect-auto md:h-full rounded-[1.5rem]";
  const className = `group relative block h-full overflow-hidden bg-cloud ${shape}`;
  // The tours tile opens its own page; the rest scroll to their section here.
  return way.href.startsWith("#") ? (
    <SmoothAnchor href={way.href as `#${string}`} className={className}>
      {inner}
    </SmoothAnchor>
  ) : (
    <Link href={way.href} className={className}>
      {inner}
    </Link>
  );
}
