/**
 * The destination hub's content bands below the tour list. Server components;
 * nothing animates on scroll (the client asked for none).
 */
import Image from "next/image";
import type { Destination } from "@/content/destinations/schema";
import { resolveSitePath } from "@/content/routes";
import { formatMonthYear, plural } from "@/features/experiences/format";
import { RatingStars } from "@/features/experiences/rating-stars";
import { ArrowRightIcon, ArrowUpRightIcon, CarIcon, HeadsetIcon, ShieldCheckIcon, WalletIcon } from "@/ui/icons";

/** Section title, with an optional action on the right. */
export function SectionHead({ id, title, action }: { id: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="wrap flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <h2 id={id} className="font-display text-title font-bold tracking-[-0.03em]">
        {title}
      </h2>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------- Attractions */

/** Numbered photo tiles. Phones: a sideways swipe row. Not links (no attraction pages yet). */
export function Attractions({ name, attractions }: { name: string; attractions: Destination["attractions"] }) {
  if (!attractions.length) return null;
  return (
    <section aria-labelledby="attractions-title" className="flex flex-col gap-10 py-20 md:py-28">
      <SectionHead id="attractions-title" title={`Top attractions in ${name}`} />
      <div className="sm:wrap">
      <ol className="scrollbar-none relative flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter-x) px-(--gutter-x) pb-1 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {attractions.map((a, i) => (
          <li key={a.name} className="flex w-[60%] shrink-0 snap-start flex-col gap-4 sm:w-auto">
            <div className={`relative aspect-[4/5] overflow-hidden bg-cloud sm:aspect-square ${i % 2 ? "rounded-t-full rounded-b-[1.75rem]" : "rounded-tl-[2.25rem] rounded-br-[2.25rem]"}`}>
              <Image src={a.image.src} alt={a.image.alt} fill sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 60vw" className="object-cover" />
              <span aria-hidden="true" className="absolute bottom-4 left-4 rounded-full bg-fog/90 px-2.5 py-1 font-mono text-[0.75rem] font-semibold text-ink tabular-nums backdrop-blur">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-[1.05rem] leading-snug font-semibold tracking-[-0.01em]">{a.name}</span>
              <span className="text-[0.85rem] font-medium text-mandarin">{a.place}</span>
              <span className="text-[0.92rem] leading-relaxed text-moss">{a.text}</span>
            </div>
          </li>
        ))}
      </ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- Reviews */

/** Dark band: the hub's overall score and a wall of short reviews. */
export function HubReviews({ name, rating, reviewCount, reviews }: { name: string; rating: number; reviewCount: number; reviews: Destination["reviews"] }) {
  if (!reviews.length) return null;
  const sorted = [...reviews].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section aria-labelledby="reviews-title" className="bg-river-deep py-20 text-fog md:py-28">
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <h2 id="reviews-title" className="font-display text-title font-bold tracking-[-0.03em]">
            What travellers say about {name}
          </h2>
          <div className="flex items-end gap-4">
            <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] leading-[0.85] font-bold tracking-[-0.04em] tabular-nums">{rating.toFixed(1)}</span>
            <span className="flex flex-col gap-1.5 pb-1">
              <RatingStars value={rating} className="text-[1.1rem] [&>span:first-child]:text-fog/20" />
              <span className="text-[0.9rem] text-fog/60">{plural(reviewCount, "review", "reviews")} across our {name} tours</span>
            </span>
          </div>
        </div>

        <ul className="scrollbar-none relative -mx-(--gutter-x) flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter-x) px-(--gutter-x) pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:col-span-8">
          {sorted.map((r) => (
            <li key={`${r.name}-${r.date}`} className="flex w-[85%] shrink-0 snap-start flex-col gap-4 rounded-tl-[1.75rem] rounded-br-[1.75rem] bg-white/[0.06] p-6 md:w-auto">
              <span className="flex items-center justify-between gap-3">
                <RatingStars value={r.rating} className="text-[0.95rem] [&>span:first-child]:text-fog/20" />
                <span className="sr-only">{r.rating} out of 5</span>
                <span className="font-mono text-[0.72rem] text-fog/50">{formatMonthYear(r.date)}</span>
              </span>
              <p className="flex-1 leading-relaxed text-fog/90">“{r.text}”</p>
              <span className="flex flex-col gap-0.5 border-t border-white/10 pt-4">
                <span className="font-medium">
                  {r.name} <span className="font-normal text-fog/50">· {r.from}</span>
                </span>
                <span className="truncate text-[0.82rem] text-jade">{r.tour}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- Guides */

/** Travel-guide article teasers. The articles are not written yet, so these are not links. */
export function GuideCard({ guide }: { guide: Destination["guides"][number] }) {
  return (
    <article className="flex h-full flex-col gap-4">
      <div className="relative aspect-[16/11] overflow-hidden rounded-[1.75rem] rounded-tr-[4rem] bg-cloud">
        <Image src={guide.image.src} alt={guide.image.alt} fill sizes="(min-width: 640px) 336px, 78vw" className="object-cover" />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-[1.15rem] leading-snug font-semibold tracking-[-0.01em]">{guide.title}</h3>
        <span className="flex items-center gap-2 text-[0.85rem] text-moss">
          <span className="font-medium text-mandarin">{guide.tag}</span>
          <span aria-hidden="true">·</span>
          <span>{guide.minutes} min read</span>
        </span>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------ FAQ + callback */

export function FaqWithCallback({ name, faqs, callback }: { name: string; faqs: Destination["faqs"]; callback: Destination["callback"] }) {
  if (!faqs.length && !callback) return null;
  return (
    <section aria-labelledby="faq-title" className="py-20 md:py-28">
      <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col gap-8 lg:col-span-8">
          <h2 id="faq-title" className="font-display text-title font-bold tracking-[-0.03em]">
            Questions about {name} tours
          </h2>
          <div className="flex flex-col">
            {faqs.map((f) => (
              <details key={f.question} className="group border-t border-ink/12 last:border-b">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-display text-[1.08rem] font-medium [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <span aria-hidden="true" className="relative grid size-9 shrink-0 place-items-center rounded-full border border-ink/20 transition-colors group-open:bg-ink group-open:text-fog">
                    <span className="absolute h-px w-3.5 bg-current" />
                    <span className="absolute h-3.5 w-px bg-current transition-transform duration-500 ease-out-expo group-open:rotate-90" />
                  </span>
                </summary>
                <p className="max-w-[68ch] pb-6 leading-relaxed text-ink/85">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>

        {callback ? (
          <aside className="lg:col-span-4">
            <div className="relative flex flex-col gap-6 overflow-hidden rounded-tr-[2.25rem] rounded-bl-[2.25rem] bg-mandarin p-7 text-ink lg:sticky lg:top-48">
              <span className="grid size-12 place-items-center rounded-full bg-ink text-xl text-fog">
                <HeadsetIcon />
              </span>
              <p className="font-display text-[1.5rem] leading-[1.1] font-bold tracking-[-0.02em]">{callback.title}</p>
              <p className="leading-relaxed text-ink/80">{callback.text}</p>
              <a
                href="#enquiry"
                className="group inline-flex items-center justify-between gap-3 self-start rounded-full bg-ink py-2 pr-2 pl-5 font-display font-semibold text-fog transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
              >
                {callback.cta}
                <span className="grid size-9 place-items-center rounded-full bg-fog text-ink transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                  <ArrowRightIcon />
                </span>
              </a>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- Nearby */

export function Nearby({ nearby }: { nearby: Destination["nearby"] }) {
  if (!nearby.length) return null;
  return (
    <section aria-labelledby="nearby-title" className="flex flex-col gap-10 py-20 md:py-28">
      <SectionHead id="nearby-title" title="Explore tours nearby" />
      <div className="md:wrap">
      <ul className="scrollbar-none relative flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-(--gutter-x) px-(--gutter-x) pb-1 md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:pb-0">
        {nearby.map((n) => (
          <li key={n.name} className="w-[58%] shrink-0 snap-start md:w-auto">
            <a href={resolveSitePath(n.href)} className="group relative block aspect-[3/4] overflow-hidden rounded-t-full rounded-b-[1.75rem] bg-cloud">
              <Image src={n.image.src} alt={n.image.alt} fill sizes="(min-width: 768px) 19vw, 58vw" className="object-cover transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.06]" />
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-river-deep/85 via-river-deep/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5 text-fog">
                <span className="flex items-center justify-between gap-2 font-display text-[1.2rem] font-semibold">
                  {n.name}
                  <ArrowUpRightIcon className="shrink-0 transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
                <span className="text-[0.82rem] text-fog/75">{n.text}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ Why */

const WHY_ICONS = [HeadsetIcon, CarIcon, WalletIcon, ShieldCheckIcon];

export function WhyChoose({ why }: { why: Destination["why"] }) {
  if (!why.length) return null;
  return (
    <section aria-labelledby="why-title" className="bg-cloud py-20 md:py-28">
      <div className="flex flex-col gap-12">
        <SectionHead id="why-title" title="Planned by people who live here" />
        <div className="sm:wrap">
        <ul className="scrollbar-none relative flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter-x) px-(--gutter-x) pb-1 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {why.map((w, i) => {
            const Icon = WHY_ICONS[i % WHY_ICONS.length]!;
            return (
              <li key={w.title} className="flex w-[72%] shrink-0 snap-start flex-col gap-4 rounded-[1.5rem] bg-fog p-6 sm:w-auto sm:rounded-none sm:border-t sm:border-ink/15 sm:bg-transparent sm:p-0 sm:pt-6">
                <span className="grid size-12 place-items-center rounded-full bg-river text-xl text-jade">
                  <Icon />
                </span>
                <span className="font-display text-[1.2rem] font-semibold tracking-[-0.01em]">{w.title}</span>
                <span className="leading-relaxed text-moss">{w.text}</span>
              </li>
            );
          })}
        </ul>
        </div>
      </div>
    </section>
  );
}
