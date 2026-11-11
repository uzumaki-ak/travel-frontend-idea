import Image from "next/image";
import { home } from "@/content/home";
import { ArrowRightIcon, WhatsAppIcon } from "@/ui/icons";
import { HeroGallery } from "./hero-gallery";

/**
 * The headline is the page's own title ("Local Cabs and Hotel Service Provider
 * in Meghalaya"), set as four masked lines. The intro sequence is pure CSS
 * (see `.hero-line` / `.hero-slit` in globals.css) so it plays on first paint.
 */
const HEADLINE_LINES = [
  { text: "Local Cabs", className: "" },
  { text: "and Hotel", className: "pl-[8vw]" },
  { text: "Service Provider", className: "[font-stretch:78%]" },
  { text: "in Meghalaya", className: "text-river" },
] as const;

export function HeroSection() {
  const { hero, intro, contact, enquiry } = home;
  const [lead] = intro;

  return (
    <section aria-labelledby="hero-title" className="relative pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+4.5rem)]">
      <div className="wrap grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-8 lg:col-span-7 md:gap-10">
          <h1
            id="hero-title"
            // Full width on phones/tablets; shares the row with the gallery from lg up.
            className="font-display text-hero font-bold tracking-[-0.045em] uppercase [font-variation-settings:'opsz'_96] lg:text-[clamp(3.5rem,6vw,7.75rem)]"
          >
            {HEADLINE_LINES.map((line, i) => (
              <span key={line.text} className={`hero-line ${line.className}`} style={{ "--i": i } as React.CSSProperties}>
                <span>{line.text}</span>
              </span>
            ))}
          </h1>

          <p
            className="hero-fade max-w-[34rem] text-[1.0625rem] leading-relaxed text-moss md:text-lg"
            style={{ "--delay": "650ms" } as React.CSSProperties}
          >
            {lead}
          </p>

          <div
            className="hero-fade flex flex-wrap items-center gap-3"
            style={{ "--delay": "780ms" } as React.CSSProperties}
          >
            <a
              href="#enquiry"
              className="group inline-flex items-center gap-3 rounded-full bg-ink py-3 pr-3 pl-6 font-display text-base font-semibold text-fog transition-colors hover:bg-river"
            >
              {enquiry.stickyButtonLabel}
              <span className="grid size-9 place-items-center rounded-full bg-mandarin text-lg text-ink transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                <ArrowRightIcon />
              </span>
            </a>
            <a
              href={contact.whatsapp.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2.5 rounded-full border border-ink/20 px-5 py-3.5 text-[0.95rem] transition-colors hover:border-ink"
            >
              <WhatsAppIcon className="text-lg" />
              <span className="text-moss">{contact.whatsapp.label}</span>
              <span className="font-mono text-[0.8rem] tabular-nums">{contact.whatsapp.value}</span>
            </a>
          </div>
        </div>

        <div className="lg:col-span-5">
          <HeroGallery />
        </div>
      </div>

      {/* Panorama: opens from a slit on load (CSS), then widens to full bleed on scroll (GSAP). */}
      <figure className="relative mt-14 md:mt-20">
        <div
          data-motion="panorama"
          className="relative overflow-clip [clip-path:inset(0_var(--gutter-x)_0_var(--gutter-x)_round_28px)]"
        >
          <div className="hero-slit relative aspect-[4/3] w-full sm:aspect-[16/7] lg:aspect-[16/5.5]">
            <Image
              src={hero.src}
              alt={hero.alt}
              fill
              preload
              sizes="100vw"
              className="object-cover will-change-transform"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 overflow-clip">
              <div className="mist absolute -inset-x-1/4 bottom-[-30%] h-full bg-[radial-gradient(50%_60%_at_30%_70%,rgb(240_243_240/0.55),transparent_70%),radial-gradient(40%_55%_at_75%_80%,rgb(240_243_240/0.45),transparent_70%)]" />
            </div>
          </div>
        </div>
        <figcaption className="wrap mt-4 flex items-center justify-between label text-moss">
          <span>{hero.alt}</span>
          <span aria-hidden="true">↓</span>
        </figcaption>
      </figure>
    </section>
  );
}
