import Image from "next/image";
import { resolveSitePath } from "@/content/routes";
import type { Tour } from "@/content/tours";
import { ClockIcon } from "@/ui/icons";
import { RippleTile } from "./tour-card";

type Crumb = { label: string; href: string };

/**
 * Tour opener: breadcrumb, title, duration, and a photo cluster built from the
 * tour's own gallery (arch + capsule + circle), animated like the homepage hero.
 */
export function TourHero({ tour, crumbs }: { tour: Tour; crumbs: Crumb[] }) {
  const [first, second, third] = tour.gallery;

  return (
    <section aria-labelledby="tour-title" className="relative pt-[calc(var(--header-h)+2.5rem)] md:pt-[calc(var(--header-h)+4rem)]">
      <div className="wrap grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="flex min-w-0 flex-col gap-7 lg:col-span-7">
          <nav aria-label="Breadcrumb" className="hero-fade [--delay:100ms]">
            <ol className="flex flex-wrap items-center gap-2 label text-moss">
              {crumbs.map((c) => (
                <li key={c.href} className="flex items-center gap-2">
                  <a href={resolveSitePath(c.href)} className="hover:text-ink">
                    {c.label}
                  </a>
                  <span aria-hidden="true">/</span>
                </li>
              ))}
              <li aria-current="page" className="text-ink">
                {tour.title}
              </li>
            </ol>
          </nav>

          <h1
            id="tour-title"
            className="hero-line font-display text-[clamp(2.4rem,5.4vw,5.5rem)] leading-[0.95] font-bold tracking-[-0.04em] [font-variation-settings:'opsz'_96]"
          >
            <span>{tour.title}</span>
          </h1>

          {tour.duration ? (
            <p className="hero-fade flex items-center gap-3 [--delay:450ms]">
              <span className="grid size-10 place-items-center rounded-full bg-river text-lg text-jade">
                <ClockIcon />
              </span>
              <span className="flex flex-col">
                <span className="label text-moss">{tour.duration.label}</span>
                <span className="font-mono text-[1rem] tabular-nums">{tour.duration.value}</span>
              </span>
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-5">
          <div
            data-pointer-zone=""
            className="relative mx-auto h-[clamp(280px,80vw,440px)] w-full max-w-[32rem] lg:h-[min(40vw,560px)] lg:max-w-none"
          >
            <div aria-hidden="true" className="hero-fade absolute top-[6%] left-1/2 aspect-square w-[80%] -translate-x-1/2 [--delay:200ms]">
              <div className="hero-orbit absolute inset-0 rounded-full border border-dashed border-ink/12 before:absolute before:inset-[10%] before:rounded-full before:border before:border-ink/8">
                <span className="absolute top-[14.6%] left-[14.6%] size-2.5 -translate-1/2 rounded-full bg-mandarin" />
              </div>
            </div>

            <Shot src={first?.src} alt={first?.alt ?? tour.title} box="left-[24%] top-0 h-full w-[46%]" shape="rounded-t-[50cqw] rounded-b-[2.25rem]" speed={-0.06} delay={250} sizes="(min-width: 1024px) 19vw, 46vw" preload />
            {second ? (
              <Shot src={second.src} alt={second.alt} box="right-0 top-[18%] h-[62%] w-[27%]" shape="rounded-full" speed={0.14} delay={450} sizes="(min-width: 1024px) 11vw, 27vw" />
            ) : null}
            {third ? (
              <Shot src={third.src} alt={third.alt} box="left-0 bottom-[2%] w-[30%] aspect-square" shape="rounded-full" speed={0.24} delay={650} sizes="(min-width: 1024px) 12vw, 30vw" ring />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

type ShotProps = {
  src?: string;
  alt: string;
  box: string;
  shape: string;
  speed: number;
  delay: number;
  sizes: string;
  preload?: boolean;
  ring?: boolean;
};

function Shot({ src, alt, box, shape, speed, delay, sizes, preload = false, ring = false }: ShotProps) {
  return (
    <div data-speed={speed} data-depth={speed * 120} className={`@container absolute ${box}`}>
      <div
        className={`hero-pop group relative h-full w-full overflow-clip bg-river ${shape} ${ring ? "outline-[6px] outline-fog outline-solid" : ""}`}
        style={{ "--delay": `${delay}ms`, "--float": `${-6 - speed * 40}px` } as React.CSSProperties}
      >
        {src ? <Image src={src} alt={alt} fill sizes={sizes} preload={preload} className="object-cover" /> : <RippleTile />}
      </div>
    </div>
  );
}
