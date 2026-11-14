import { resolveSitePath } from "@/content/routes";
import type { ContentBlock, InlineRun } from "@/content/tours";

/**
 * Renders snapshot text blocks. No raw HTML is ever injected: every string is
 * a React text node, and links only exist if they passed the whitelist in the
 * sync script (site paths, Google Maps, own contact links).
 */
export function Inline({ runs }: { runs: InlineRun[] }) {
  return (
    <>
      {runs.map((run, i) => {
        const text = run.bold ? <strong className="font-semibold text-ink">{run.text}</strong> : run.text;
        if (!run.href) return <span key={i}>{text}</span>;
        const external = /^https?:/.test(run.href);
        return (
          <a
            key={i}
            href={external ? run.href : resolveSitePath(run.href)}
            {...(external && { target: "_blank", rel: "noopener noreferrer nofollow" })}
            className="text-river underline decoration-mandarin decoration-2 underline-offset-4 hover:text-ink"
          >
            {text}
          </a>
        );
      })}
    </>
  );
}

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {groupFacts(blocks).map((block, i) => {
        switch (block.type) {
          case "facts":
            return (
              <dl key={i} className="grid gap-x-8 gap-y-4 border-t border-ink/10 pt-5 sm:grid-cols-3">
                {block.items.map((fact) => (
                  <div key={fact.label} className="flex min-w-0 flex-col gap-1">
                    <dt className="label text-moss">{fact.label}</dt>
                    <dd className="text-[1rem] leading-snug">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            );
          case "p":
            return (
              <p key={i} className="max-w-[68ch] text-[1.0625rem] leading-relaxed text-moss">
                <Inline runs={block.content} />
              </p>
            );
          case "list":
            return (
              <ul key={i} className="flex max-w-[68ch] flex-col gap-3">
                {block.items.map((item, j) => (
                  <li key={j} className="flex gap-3 text-[1rem] leading-relaxed text-moss">
                    <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rotate-45 bg-mandarin" />
                    <span className="min-w-0">
                      <Inline runs={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "label":
            return (
              <p key={i} className="font-display text-[1.1rem] font-semibold">
                {block.text}
              </p>
            );
          case "heading":
            return (
              <h3 key={i} className="mt-4 font-display text-[1.35rem] font-semibold tracking-[-0.01em]">
                {block.text}
              </h3>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-tl-2xl rounded-br-2xl border border-ink/10">
                <table className="w-full min-w-[30rem] border-collapse text-left text-[0.95rem]">
                  {block.caption ? (
                    <caption className="bg-ink px-4 py-3 text-left font-display font-semibold text-fog">{block.caption}</caption>
                  ) : null}
                  {block.head.length ? (
                    <thead>
                      <tr className="bg-cloud">
                        {block.head.map((h) => (
                          <th key={h} scope="col" className="label px-4 py-3 text-moss">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  ) : null}
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className="border-t border-ink/10">
                        {row.map((cell, c) => (
                          <td key={c} className={`px-4 py-3 ${c > 0 ? "font-mono text-[0.85rem] tabular-nums" : ""}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </div>
  );
}

type FactBlock = Extract<ContentBlock, { type: "fact" }>;
type RenderBlock = Exclude<ContentBlock, FactBlock> | { type: "facts"; items: FactBlock[] };

/** Consecutive "Label: value" lines read better as one definition grid. */
function groupFacts(blocks: ContentBlock[]): RenderBlock[] {
  const out: RenderBlock[] = [];
  for (const block of blocks) {
    const last = out.at(-1);
    if (block.type === "fact") {
      if (last?.type === "facts") last.items.push(block);
      else out.push({ type: "facts", items: [block] });
    } else {
      out.push(block);
    }
  }
  return out;
}
