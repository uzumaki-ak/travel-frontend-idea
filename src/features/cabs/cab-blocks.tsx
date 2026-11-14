import Image from "next/image";
import type { CabBlock, CabTableCell } from "@/content/cabs";
import { resolveSitePath } from "@/content/routes";
import { Inline } from "@/features/tours/content-blocks";
import { TourCard } from "@/features/tours/tour-card";
import { ArrowUpRightIcon, ChevronDownIcon } from "@/ui/icons";
import { Rail } from "@/ui/rail";
import { LEAF } from "@/ui/shape";

/**
 * Renders a cab page's article in reading order. Text-only React nodes — no raw
 * HTML — and every link went through the sync whitelist + route resolver.
 * Prose sits in a readable column; tables, rails and cards may run wider.
 */
export function CabBlocks({ blocks }: { blocks: CabBlock[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}

const PROSE = "mx-auto w-full max-w-[46rem]";
const WIDE = "mx-auto w-full max-w-[68rem]";

function BlockView({ block }: { block: CabBlock }) {
  switch (block.type) {
    case "heading": {
      if (block.level <= 2)
        return (
          <h2 data-motion="lines" className={`${PROSE} mt-10 font-display text-title font-semibold tracking-[-0.02em] first:mt-0`}>
            {block.text}
          </h2>
        );
      if (block.level === 3)
        return <h3 className={`${PROSE} mt-4 font-display text-[1.4rem] leading-tight font-semibold tracking-[-0.01em]`}>{block.text}</h3>;
      return <h4 className={`${PROSE} font-display text-[1.15rem] font-semibold`}>{block.text}</h4>;
    }
    case "p":
      return (
        <p className={`${PROSE} text-[1.0625rem] leading-relaxed text-moss`}>
          <Inline runs={block.content} />
        </p>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className={`${PROSE} flex flex-col gap-2.5`}>
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[1.0625rem] leading-relaxed text-moss">
              {block.ordered ? (
                <span className="mt-0.5 font-mono text-[0.85rem] text-mandarin tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              ) : (
                <span aria-hidden="true" className="mt-[0.65em] size-1.5 shrink-0 rotate-45 bg-mandarin" />
              )}
              <span className="min-w-0">
                <Inline runs={item} />
              </span>
            </li>
          ))}
        </List>
      );
    }
    case "table":
      return <CabTable caption={block.caption} head={block.head} rows={block.rows} />;
    case "image":
      return (
        <figure className={`${WIDE} flex flex-col gap-3`}>
          <div className={`relative aspect-[16/9] overflow-clip bg-river ${LEAF}`}>
            <Image src={block.src} alt={block.alt} fill sizes="(min-width: 1100px) 1088px, 100vw" className="object-cover" />
          </div>
          {block.caption ? <figcaption className="label text-moss">{block.caption}</figcaption> : null}
        </figure>
      );
    case "faq":
      return (
        <div className={`${PROSE} flex flex-col`}>
          {block.items.map((item, i) => (
            <details key={i} name="cab-faq" className="group border-b border-ink/10 py-1 first:border-t">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 font-display text-[1.1rem] font-semibold [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <ChevronDownIcon className="mt-1 shrink-0 text-xl text-mandarin transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-[1rem] leading-relaxed text-moss">
                <Inline runs={item.answer} />
              </p>
            </details>
          ))}
        </div>
      );
    case "links":
      return (
        <div className={`${WIDE} flex flex-col gap-5`}>
          {block.title ? <h2 className="font-display text-title font-semibold tracking-[-0.02em]">{block.title}</h2> : null}
          <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {block.items.map((link) => (
              <li key={link.href + link.label} className="border-b border-ink/10">
                <a href={resolveSitePath(link.href)} className="group flex items-center justify-between gap-4 py-3.5 text-[1rem] transition-colors hover:text-river">
                  <span>{link.label}</span>
                  <ArrowUpRightIcon className="shrink-0 text-mandarin transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      );
    case "cards":
      return (
        <div className="-mx-[max(var(--gutter-x),env(safe-area-inset-left,0px))] flex flex-col gap-8 py-6">
          {block.title ? (
            <div className="wrap">
              <h2 className={`${WIDE} font-display text-title font-semibold tracking-[-0.02em]`}>{block.title}</h2>
            </div>
          ) : null}
          <Rail label={block.title ?? "Tour packages"}>
            {block.items.map((item) => (
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
        </div>
      );
    case "routes":
      return (
        <div className={`${WIDE} grid gap-4 md:grid-cols-2 lg:grid-cols-3`}>
          {block.columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4 rounded-tl-[1.75rem] rounded-br-[1.75rem] bg-cloud p-5">
              <p className="label text-mandarin">{col.title}</p>
              <ol className="relative flex flex-col gap-2.5 border-l border-dashed border-ink/25 pl-5">
                {col.stops.map((stop) => (
                  <li key={stop} className="relative text-[0.98rem]">
                    <span aria-hidden="true" className="absolute top-[0.55em] -left-[1.47rem] size-2 rounded-full bg-river" />
                    {stop}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      );
    case "trips":
      return (
        <div className={`${WIDE} grid gap-4 lg:grid-cols-3`}>
          {block.items.map((trip) => (
            <article key={trip.title} className="flex flex-col gap-5 rounded-tl-[2rem] rounded-br-[2rem] bg-ink p-6 text-fog">
              <div className="flex items-start gap-4">
                <span className="font-mono text-[0.85rem] text-mandarin tabular-nums">{trip.number}</span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-[1.35rem] leading-tight font-semibold">{trip.title}</h3>
                  <span className="label text-jade">{trip.duration}</span>
                </div>
              </div>
              <ol className="flex flex-col gap-4 border-l border-white/15 pl-5">
                {trip.days.map((day) => (
                  <li key={day.marker} className="flex flex-col gap-1">
                    <span className="label text-jade">{day.marker}</span>
                    <span className="font-display font-semibold">{day.title}</span>
                    <span className="text-[0.95rem] leading-relaxed text-fog/70">{day.text}</span>
                  </li>
                ))}
              </ol>
              {trip.route ? (
                <p className="mt-auto border-t border-white/15 pt-4 text-[0.95rem] text-fog/80">
                  <strong className="font-semibold text-fog">{trip.route.label}</strong> {trip.route.text}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      );
  }
}

function CabTable({ caption, head, rows }: { caption?: string; head: CabTableCell[][]; rows: CabTableCell[][] }) {
  const cell = (c: CabTableCell, i: number, Tag: "th" | "td", scope?: "col") => (
    <Tag
      key={i}
      scope={scope}
      colSpan={c.colSpan}
      rowSpan={c.rowSpan}
      className={Tag === "th" ? "label px-4 py-3 text-left align-bottom text-moss" : "px-4 py-3 align-top text-[0.95rem]"}
    >
      {c.image ? (
        <span className="flex items-center gap-3">
          <span className="relative size-12 shrink-0 overflow-clip rounded-xl bg-cloud">
            <Image src={c.image.src} alt={c.image.alt} fill sizes="48px" className="object-cover" />
          </span>
          {c.text}
        </span>
      ) : (
        c.text
      )}
    </Tag>
  );

  return (
    <div className={`${WIDE} overflow-x-auto rounded-tl-2xl rounded-br-2xl border border-ink/10`}>
      <table className="w-full min-w-[34rem] border-collapse">
        {caption ? <caption className="bg-ink px-4 py-3 text-left font-display font-semibold text-fog">{caption}</caption> : null}
        {head.length ? (
          <thead className="bg-cloud">
            {head.map((row, r) => (
              <tr key={r}>{row.map((c, i) => cell(c, i, "th", "col"))}</tr>
            ))}
          </thead>
        ) : null}
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t border-ink/10 [&>td:not(:first-child)]:font-mono [&>td:not(:first-child)]:text-[0.85rem] [&>td:not(:first-child)]:tabular-nums">
              {row.map((c, i) => cell(c, i, "td"))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
