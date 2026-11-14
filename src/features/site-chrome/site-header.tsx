import Image from "next/image";
import Link from "next/link";
import { resolveSitePath } from "@/content/routes";
import { home } from "@/content/home";
import { HeaderShell } from "./header-shell";

export function SiteHeader({ section }: { section: string }) {
  const { contact, nav, brand, enquiry } = home;

  return (
    <HeaderShell>
      {/* Original top bar: Call / WhatsApp / Email — desktop only; the dock covers phones. */}
      <div className="hidden border-b border-ink/10 transition-colors group-data-scrolled/header:border-transparent md:block">
        <ul className="wrap flex h-8 items-center gap-8 label text-moss">
          {[contact.call, contact.whatsapp, contact.email].map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span>{item.label}</span>
              <a href={item.href} className="text-ink underline-offset-4 hover:underline">
                {item.value}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="wrap flex h-(--header-h) items-center justify-between gap-6">
        <Link href="/" aria-label={`${brand.name} home`} className="shrink-0">
          <Image src={brand.logo} alt={brand.name} width={300} height={59} preload className="h-auto w-28 sm:w-32" />
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-6">
          <ul className="flex items-center gap-1 sm:gap-6">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={resolveSitePath(item.href)}
                  aria-current={item.href === section ? (section === "/" ? "page" : "true") : undefined}
                  className="relative px-2 py-2 font-display text-[0.95rem] font-medium after:absolute after:inset-x-2 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-out-expo hover:after:scale-x-100 aria-[current]:after:scale-x-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#enquiry"
            className="ml-2 hidden rounded-full bg-mandarin px-5 py-2.5 font-display text-[0.95rem] font-semibold text-ink transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 md:inline-block"
          >
            {enquiry.stickyButtonLabel}
          </a>
        </nav>
      </div>
    </HeaderShell>
  );
}
