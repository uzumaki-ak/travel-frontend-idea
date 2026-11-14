import Image from "next/image";
import type { ArchiveCard as ArchiveCardData } from "@/content/tour-archive";
import { ArrowRightIcon, ArrowUpRightIcon, ClockIcon } from "@/ui/icons";
import { LEAF } from "@/ui/shape";
import { includeIcon } from "./include-icons";
import { RippleTile } from "./tour-card";

/** One card of the "Our Tours" listing. All text is the live listing's own. */
export function ArchiveCard({ card, href }: { card: ArchiveCardData; href: string }) {
  return (
    <article className="group flex h-full flex-col">
      <a href={href} tabIndex={-1} aria-hidden="true" className={`relative block aspect-[4/3] overflow-clip bg-river ${LEAF}`}>
        {card.image ? (
          <Image
            src={card.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            className="object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-[1.06]"
          />
        ) : (
          <RippleTile />
        )}
        {card.duration ? (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-fog/90 px-3 py-1.5 label text-ink backdrop-blur-sm">
            <ClockIcon className="text-[0.85rem]" />
            {card.duration}
          </span>
        ) : null}
      </a>

      <div className="flex flex-1 flex-col gap-4 pt-5">
        <h2 className="font-display text-[1.35rem] leading-[1.12] font-semibold tracking-[-0.01em]">
          <a href={href} className="decoration-mandarin decoration-2 underline-offset-4 hover:underline">
            {card.title}
          </a>
        </h2>

        {card.price ? (
          <p className="flex flex-wrap items-baseline gap-x-1.5 font-mono text-[0.85rem] text-moss tabular-nums">
            <span>{card.price.label}</span>
            <span className="font-display text-[1.35rem] font-bold text-ink">
              <span aria-hidden="true">₹</span>
              <span className="sr-only">Rupees</span> {card.price.amount}
            </span>
            <span>{card.price.unit}</span>
          </p>
        ) : null}

        {card.includes.length ? (
          <ul className="flex gap-2" aria-label="Package includes">
            {card.includes.map((name) => {
              const Icon = includeIcon(name);
              return (
                <li key={name} title={name} className="grid size-9 place-items-center rounded-full bg-cloud text-[1.05rem] text-river">
                  <Icon title={name} />
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <a
            href={`${href}#enquiry`}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-mandarin px-4 py-2.5 font-display text-[0.95rem] font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
          >
            {card.queryLabel}
            <ArrowRightIcon className="text-[0.95rem]" />
          </a>
          <a
            href={href}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-4 py-2.5 font-display text-[0.95rem] font-semibold transition-colors hover:border-ink hover:bg-ink hover:text-fog"
          >
            {card.detailsLabel}
            <ArrowUpRightIcon className="text-[0.95rem]" />
          </a>
        </div>
      </div>
    </article>
  );
}
