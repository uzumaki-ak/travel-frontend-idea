import { home } from "@/content/home";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/ui/icons";
import { EnquiryForm, type EnquiryFormContext, type EnquiryFormCopy } from "./enquiry-form";

type EnquirySectionProps = {
  /** Heading from the source page ("Query Form" on the homepage, "Package Query Form" on tours). */
  title?: string;
  context?: EnquiryFormContext;
  /** Tighter spacing and a smaller heading when shown inside the enquiry popup. */
  inDialog?: boolean;
};

export function EnquirySection({ title, context, inDialog = false }: EnquirySectionProps = {}) {
  const { enquiry, contact } = home;

  const copy: EnquiryFormCopy = {
    labels: enquiry.labels,
    placeholders: enquiry.placeholders,
    submitLabel: enquiry.submitLabel,
    honeypotLabel: enquiry.honeypotLabel,
    fallback: { label: contact.whatsapp.label, value: contact.whatsapp.value, href: enquiry.whatsappHref },
  };

  const lines = [
    { ...contact.call, Icon: PhoneIcon },
    { ...contact.whatsapp, Icon: WhatsAppIcon },
    { ...contact.email, Icon: MailIcon },
  ];

  return (
    <section
      id="enquiry"
      aria-labelledby="enquiry-title"
      className={inDialog ? "px-5 pt-5 pb-10 md:p-10 md:pt-12" : "scroll-mt-24 py-24 md:py-36"}
    >
      <div className={inDialog ? "grid gap-10 lg:grid-cols-12" : "wrap grid gap-16 lg:grid-cols-12"}>
        <div className={inDialog ? "flex flex-col gap-6 lg:col-span-5" : "flex flex-col gap-10 lg:col-span-5"}>
          <h2
            id="enquiry-title"
            data-motion={inDialog ? undefined : "lines"}
            className={`font-display font-bold tracking-[-0.04em] uppercase ${inDialog ? "hidden pr-14 text-title md:block" : "text-display"}`}
          >
            {title ?? enquiry.formTitle}
          </h2>
          {/* In the popup on phones the contact lines shrink to a row of icon buttons. */}
          <ul className={inDialog ? "flex gap-3 md:flex-col md:gap-4" : "flex flex-col gap-4"}>
            {lines.map(({ label, value, href, Icon }) => (
              <li key={label} data-motion={inDialog ? undefined : "rise"}>
                <a href={href} aria-label={inDialog ? `${label} ${value}` : undefined} className="group flex items-center gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cloud text-xl transition-colors group-hover:bg-ink group-hover:text-fog">
                    <Icon />
                  </span>
                  <span className={inDialog ? "hidden flex-col md:flex" : "flex flex-col"}>
                    <span className="label text-moss">{label}</span>
                    <span className="font-mono text-[0.95rem] tabular-nums">{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative lg:col-span-7">
          <EnquiryForm copy={copy} context={context} />
        </div>
      </div>
    </section>
  );
}
