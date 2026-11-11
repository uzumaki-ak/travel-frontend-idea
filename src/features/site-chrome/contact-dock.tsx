import { home } from "@/content/home";
import { PhoneIcon, WhatsAppIcon } from "@/ui/icons";

/**
 * The original site's sticky bar (Send Enquiry · WhatsApp · Call).
 * Phones: full-width bar above the home indicator. Desktop: a compact pill,
 * since the header already carries "Send Enquiry".
 */
export function ContactDock() {
  const { enquiry, contact } = home;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 md:inset-x-auto md:right-6 md:bottom-6"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "max(0px, env(safe-area-inset-left, 0px))",
        paddingRight: "max(0px, env(safe-area-inset-right, 0px))",
      }}
    >
      <div className="flex items-stretch gap-2 border-t border-white/10 bg-river-deep/95 p-2 text-cloud backdrop-blur-md md:rounded-full md:border-0 md:shadow-[0_12px_40px_-12px_rgb(8_44_41/0.6)]">
        <a
          href="#enquiry"
          className="flex flex-1 items-center justify-center rounded-full bg-mandarin px-5 py-3 font-display text-base font-semibold text-ink md:hidden"
        >
          {enquiry.stickyButtonLabel}
        </a>
        <a
          href={enquiry.whatsappHref}
          target="_blank"
          rel="noreferrer noopener"
          className="grid size-12 place-items-center rounded-full bg-white/10 text-2xl transition-colors hover:bg-jade hover:text-river-deep"
        >
          <WhatsAppIcon title={`${contact.whatsapp.label} ${contact.whatsapp.value}`} />
        </a>
        <a
          href={enquiry.phoneHref}
          className="grid size-12 place-items-center rounded-full bg-white/10 text-2xl transition-colors hover:bg-jade hover:text-river-deep"
        >
          <PhoneIcon title={`${contact.call.label} ${contact.call.value}`} />
        </a>
      </div>
    </div>
  );
}
