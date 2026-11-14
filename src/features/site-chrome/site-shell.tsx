import { MotionDirector } from "@/motion/motion-director";
import { ContactDock } from "./contact-dock";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/**
 * Shared page frame: skip link, header, main, footer, contact dock and the motion island.
 * `section` is the nav path this page belongs to ("/" for home, "/tours/" for tour pages).
 */
export function SiteShell({ children, section = "/" }: { children: React.ReactNode; section?: string }) {
  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-full bg-ink px-5 py-3 text-fog focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <SiteHeader section={section} />
      <main id="content">{children}</main>
      <SiteFooter />
      <ContactDock />
      <MotionDirector />
    </>
  );
}
