import { resolveSitePath } from "@/config/site";
import { home } from "@/content/home";
import { DestinationPreview } from "./destination-preview";

/**
 * Six link lists from the homepage (tourism guides, packages, camping,
 * honeymoon, Arunachal, things to do) as one editorial index. Links flow
 * like a sentence; on desktop each one shows its own photo on hover.
 */
export function DestinationsSection() {
  const groups = home.destinationGroups;
  const previews = groups.flatMap((g) => g.items).filter((item) => item.image !== null);

  return (
    <section aria-label="Destinations" className="relative py-24 md:py-36" data-preview-zone="">
      <div className="wrap flex flex-col gap-16 md:gap-24">
        {groups.map((group) => (
          <div key={group.title} className="grid gap-6 md:grid-cols-12 md:gap-10">
            <h2 data-motion="rise" className="label text-moss md:col-span-3 md:pt-3">
              {group.title}
            </h2>
            <ul className="flex flex-wrap items-baseline gap-x-3 gap-y-1 md:col-span-9">
              {group.items.map((item, i) => (
                <li key={item.href} data-motion="rise" className="flex items-baseline gap-3">
                  <a
                    href={resolveSitePath(item.href)}
                    data-preview={item.image ?? undefined}
                    className="font-display text-[clamp(1.45rem,3.3vw,2.75rem)] leading-[1.15] font-semibold tracking-[-0.025em] decoration-mandarin decoration-2 underline-offset-[0.18em] transition-colors hover:text-river hover:underline"
                  >
                    {item.title}
                  </a>
                  {i < group.items.length - 1 ? (
                    <span aria-hidden="true" className="font-display text-[clamp(1.45rem,3.3vw,2.75rem)] text-ink/20">
                      /
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <DestinationPreview images={[...new Set(previews.map((p) => p.image as string))]} />
    </section>
  );
}
