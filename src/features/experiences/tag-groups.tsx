"use client";

/**
 * SEO link blocks ("Things to do in…", "Top destinations", …) as tabs.
 * Every link is in the HTML (inactive panels are force-mounted and hidden),
 * so crawlers see all of them, not only the open tab.
 */
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowUpRightIcon } from "@/ui/icons";

type Group = { title: string; links: { label: string; href: string }[] };

export function TagGroups({ groups, title = "Keep exploring" }: { groups: Group[]; title?: string }) {
  if (!groups.length || !groups[0]) return null;
  return (
    <section aria-labelledby="tags-title" className="flex flex-col gap-8">
      <h2 id="tags-title" className="font-display text-[clamp(1.4rem,2.4vw,2rem)] font-bold tracking-[-0.02em]">
        {title}
      </h2>
      <Tabs.Root defaultValue="0" className="flex flex-col gap-6">
        <Tabs.List aria-label="Explore by" className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {groups.map((g, i) => (
            <Tabs.Trigger
              key={g.title}
              value={String(i)}
              className="shrink-0 rounded-full border border-ink/15 px-4 py-2 text-[0.9rem] font-medium transition-colors hover:border-ink data-[state=active]:border-ink data-[state=active]:bg-ink data-[state=active]:text-fog"
            >
              {g.title}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {groups.map((g, i) => (
          <Tabs.Content key={g.title} value={String(i)} forceMount className="data-[state=inactive]:hidden">
            <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {g.links.map((l) => (
                <li key={l.href} className="border-b border-ink/10">
                  <a href={l.href} rel="noreferrer noopener" className="group flex items-center justify-between gap-4 py-4 transition-colors hover:text-river">
                    <span>{l.label}</span>
                    <ArrowUpRightIcon className="shrink-0 text-moss transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-river" />
                  </a>
                </li>
              ))}
            </ul>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </section>
  );
}
