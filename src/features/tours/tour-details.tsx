import Image from "next/image";
import { resolveSitePath } from "@/content/routes";
import type { GenericSection, Tour } from "@/content/tours";
import { CheckIcon, ChevronDownIcon, CrossIcon, StarIcon } from "@/ui/icons";
import { Rail } from "@/ui/rail";
import { LEAF } from "@/ui/shape";
import { ContentBlocks, Inline } from "./content-blocks";
import { TourCard } from "./tour-card";

/* ---- Gallery --------------------------------------------------------- */

export function TourGallery({ tour }: { tour: Tour }) {
  // The first three photos already open the page; the rail shows the full set.
  if (tour.gallery.length < 4) return null;
  return (
    <section aria-label={`${tour.title} photos`} className="pt-16 md:pt-24">
      <Rail label={`${tour.title} photos`}>
        {tour.gallery.map((photo, i) => (
          <figure key={photo.src} className={`relative aspect-[4/3] w-[78vw] max-w-[26rem] shrink-0 snap-start overflow-clip sm:w-[24rem] ${LEAF}`}>
            <Image
              src={photo.src}
              alt={i === 0 ? photo.alt : ""}
              fill
              sizes="(min-width: 640px) 384px, 78vw"
              draggable={false}
              className="object-cover"
            />
          </figure>
        ))}
      </Rail>
    </section>
  );
}

/* ---- Inclusions / exclusions ---------------------------------------- */

export function Inclusions({ data }: { data: NonNullable<Tour["inclusions"]> }) {
  const columns = [
    { label: data.includedLabel, items: data.included, Icon: CheckIcon, tone: "bg-jade/40 text-river" },
    { label: data.excludedLabel, items: data.excluded, Icon: CrossIcon, tone: "bg-alert/10 text-alert" },
  ].filter((c) => c.items.length);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {columns.map(({ label, items, Icon, tone }) => (
        <div key={label} data-motion="rise" className="flex flex-col gap-5 rounded-tl-[1.75rem] rounded-br-[1.75rem] bg-cloud p-6">
          <h2 className="font-display text-[1.5rem] font-semibold tracking-[-0.01em]">{label}</h2>
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item} className="flex gap-3 text-[1rem] leading-relaxed">
                <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[0.8rem] ${tone}`}>
                  <Icon />
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---- Notes + policies ----------------------------------------------- */

export function Policies({ sections }: { sections: GenericSection[] }) {
  const [notes, ...policies] = sections[0]?.title === "Please Note" ? sections : [null, ...sections];
  return (
    <div className="flex flex-col gap-10">
      {notes ? (
        <div className="flex flex-col gap-6">
          <h2 data-motion="lines" className="font-display text-title font-semibold tracking-[-0.02em]">
            {notes.title}
          </h2>
          <ContentBlocks blocks={notes.blocks} />
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {policies.map((policy) =>
          policy ? (
            <div key={policy.title} data-motion="rise" className="flex min-w-0 flex-col gap-4 border-t-2 border-ink pt-5">
              <h2 className="font-display text-[1.25rem] font-semibold">{policy.title}</h2>
              <ContentBlocks blocks={policy.blocks} />
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

/* ---- Reviews -------------------------------------------------------- */

export function Reviews({ data }: { data: NonNullable<Tour["reviews"]> }) {
  return (
    <section aria-labelledby="reviews-title" className="flex flex-col gap-10">
      <h2 id="reviews-title" data-motion="lines" className="font-display text-display font-bold tracking-[-0.04em] uppercase">
        {data.title}
      </h2>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((review) => (
          <li key={review.name} data-motion="rise" className="flex flex-col gap-4 rounded-tl-[1.75rem] rounded-br-[1.75rem] bg-cloud p-6">
            <div className="flex items-center gap-3">
              {/* Initial instead of the reviewer's personal photo. */}
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-river font-display text-lg font-semibold text-jade">
                {review.name.charAt(0)}
              </span>
              <div className="flex flex-col">
                <span className="font-display font-semibold">{review.name}</span>
                <span className="flex gap-0.5 text-[0.85rem] text-mandarin" role="img" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: review.rating }, (_, i) => (
                    <StarIcon key={i} />
                  ))}
                </span>
              </div>
            </div>
            <p className="text-[0.98rem] leading-relaxed text-moss">{review.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---- FAQ ------------------------------------------------------------ */

export function Faq({ data }: { data: NonNullable<Tour["faq"]> }) {
  return (
    <section aria-labelledby="faq-title" className="grid gap-10 lg:grid-cols-12">
      <h2 id="faq-title" data-motion="lines" className="font-display text-title font-semibold tracking-[-0.02em] lg:col-span-4">
        {data.title}
      </h2>
      {/* Native <details>: keyboard and screen-reader friendly, and every answer stays in the HTML. */}
      <div className="flex flex-col lg:col-span-8">
        {data.items.map((item, i) => (
          <details key={i} name="tour-faq" className="group border-b border-ink/10 py-1 first:border-t">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 font-display text-[1.1rem] font-semibold [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <ChevronDownIcon className="mt-1 shrink-0 text-xl text-mandarin transition-transform duration-300 group-open:rotate-180" />
            </summary>
            <p className="max-w-[68ch] pb-5 text-[1rem] leading-relaxed text-moss">
              <Inline runs={item.answer} />
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ---- Suggested tours ------------------------------------------------ */

export function RelatedTours({ data }: { data: NonNullable<Tour["related"]> }) {
  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-12">
      <div className="wrap">
        <h2 id="related-title" data-motion="lines" className="font-display text-display font-bold tracking-[-0.04em] uppercase">
          {data.title}
        </h2>
      </div>
      <Rail label={data.title}>
        {data.items.map((item) => (
          <TourCard
            key={item.href}
            layout="rail"
            sizes="(min-width: 640px) 336px, 78vw"
            tour={{
              title: item.title,
              href: resolveSitePath(item.href),
              image: item.image,
              ...(item.duration && { duration: item.duration }),
              ...(item.price && { price: item.price.amount, priceLabel: item.price.label, priceUnit: item.price.unit }),
            }}
          />
        ))}
      </Rail>
    </section>
  );
}
