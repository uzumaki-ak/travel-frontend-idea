import { home } from "@/content/home";
import { MailIcon, PhoneIcon, WhatsAppIcon } from "@/ui/icons";
import { EnquiryForm, type EnquiryFormCopy } from "./enquiry-form";

export function EnquirySection() {
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
    <section id="enquiry" aria-labelledby="enquiry-title" className="scroll-mt-24 py-24 md:py-36">
      <div className="wrap grid gap-16 lg:grid-cols-12">
        <div className="flex flex-col gap-10 lg:col-span-5">
          <h2
            id="enquiry-title"
            data-motion="lines"
            className="font-display text-display font-bold tracking-[-0.04em] uppercase"
          >
            {enquiry.formTitle}
          </h2>
          <ul className="flex flex-col gap-4">
            {lines.map(({ label, value, href, Icon }) => (
              <li key={label} data-motion="rise">
                <a href={href} className="group flex items-center gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cloud text-xl transition-colors group-hover:bg-ink group-hover:text-fog">
                    <Icon />
                  </span>
                  <span className="flex flex-col">
                    <span className="label text-moss">{label}</span>
                    <span className="font-mono text-[0.95rem] tabular-nums">{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative lg:col-span-7">
          <EnquiryForm copy={copy} />
        </div>
      </div>
    </section>
  );
}
