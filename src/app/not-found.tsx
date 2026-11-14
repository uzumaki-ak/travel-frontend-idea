import Link from "next/link";
import { home } from "@/content/home";
import { SiteShell } from "@/features/site-chrome/site-shell";
import { ArrowRightIcon } from "@/ui/icons";

export default function NotFound() {
  const [homeLink] = home.nav;
  return (
    <SiteShell section="">
      <section className="wrap flex min-h-[70svh] flex-col justify-center gap-8 pt-[calc(var(--header-h)+3rem)] pb-24">
        <p className="label text-mandarin">404</p>
        <h1 className="font-display text-display font-bold tracking-[-0.04em] uppercase">Page not found</h1>
        <Link
          href="/"
          className="group inline-flex w-fit items-center gap-3 rounded-full bg-ink py-3 pr-3 pl-6 font-display font-semibold text-fog"
        >
          {homeLink?.label ?? "Home"}
          <span className="grid size-9 place-items-center rounded-full bg-mandarin text-ink transition-transform group-hover:translate-x-1">
            <ArrowRightIcon />
          </span>
        </Link>
      </section>
    </SiteShell>
  );
}
