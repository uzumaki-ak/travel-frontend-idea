import { resolveSitePath } from "@/content/routes";
import { home } from "@/content/home";
import { socialIcons } from "@/ui/icons";

const NETWORK_NAMES: Record<string, string> = { facebook: "Facebook", twitter: "Twitter", instagram: "Instagram" };

export function SiteFooter() {
  const { footer, brand } = home;

  return (
    <footer className="relative overflow-clip bg-river-deep text-cloud">
      {/* Extra bottom room on phones so the contact dock never covers the last links. */}
      <div className="wrap grid gap-12 pt-20 pb-36 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:pb-16">
        <p className="font-display text-title font-semibold text-jade" data-motion="lines">
          {brand.name}
        </p>

        <FooterColumn title={footer.getInTouch.title}>
          {footer.getInTouch.links.map((link) => (
            <li key={link.href}>
              <a href={resolveSitePath(link.href)} className="hover:text-jade">
                {link.label}
              </a>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title={footer.taxiService.title}>
          {footer.taxiService.links.map((link) => (
            <li key={link.href}>
              <a href={resolveSitePath(link.href)} className="hover:text-jade">
                {link.label}
              </a>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title={footer.followUs.title} inline>
          {footer.followUs.links.map((link) => {
            const Icon = socialIcons[link.network];
            const name = NETWORK_NAMES[link.network] ?? link.network;
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="grid size-11 place-items-center rounded-full border border-white/20 text-xl transition-colors hover:border-jade hover:bg-jade hover:text-river-deep"
                >
                  {Icon ? <Icon title={name} /> : name}
                </a>
              </li>
            );
          })}
        </FooterColumn>
      </div>

      <div className="wrap flex flex-wrap items-end justify-between gap-4 pb-28 md:pb-10">
        <p
          aria-hidden="true"
          className="pointer-events-none -mb-[0.18em] font-display text-[22vw] leading-none font-extrabold tracking-[-0.05em] text-white/[0.06] select-none md:text-[17vw]"
        >
          {brand.name}
        </p>
        <p className="label text-cloud/60">{footer.copyright}</p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, inline = false, children }: { title: string; inline?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="label text-cloud/60">{title}</h2>
      <ul className={inline ? "flex gap-3" : "flex flex-col gap-3 text-[1.05rem]"}>{children}</ul>
    </div>
  );
}
