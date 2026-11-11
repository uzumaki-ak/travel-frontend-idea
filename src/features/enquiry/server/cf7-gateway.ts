import "server-only";
import type { Enquiry, EnquiryField } from "../enquiry.schema";

/**
 * Vendor adapter: delivers an enquiry to the existing WordPress Contact Form 7
 * form, so mail keeps arriving exactly where it does today.
 * CF7 field names come from the live form markup.
 */

const TIMEOUT_MS = 10_000;

const FIELD_FROM_CF7: Record<string, EnquiryField> = {
  "your-name": "name",
  "your-email": "email",
  "phone-number": "phone",
  "preferred-date": "travelDate",
  "number-of-adults": "adults",
  "number-of-children": "children",
  message: "message",
};

export type DeliveryResult =
  | { status: "sent"; message: string }
  | { status: "rejected"; message: string; fields: Partial<Record<EnquiryField, string>> }
  | { status: "unavailable" }
  | { status: "unknown" };

type Cf7Response = {
  status?: string;
  message?: string;
  invalid_fields?: { field?: string; message?: string }[];
};

/** `2026-12-03` → `03-12-2026`, the day-first format the old date picker produced. */
function toDayFirst(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y}`;
}

export async function deliverToCf7(
  enquiry: Enquiry,
  config: { origin: string; formId: string; pageUrl: string },
): Promise<DeliveryResult> {
  const body = new FormData();
  body.set("_wpcf7", config.formId);
  body.set("_wpcf7_unit_tag", `wpcf7-f${config.formId}-o1`);
  body.set("_wpcf7_container_post", "0");
  body.set("your-name", enquiry.name);
  body.set("your-email", enquiry.email);
  body.set("phone-number", enquiry.phone);
  body.set("preferred-date", toDayFirst(enquiry.travelDate));
  body.set("number-of-adults", String(enquiry.adults));
  body.set("number-of-children", String(enquiry.children));
  body.set("message", enquiry.message);
  body.set("link", config.pageUrl);

  let res: Response;
  try {
    res = await fetch(`${config.origin}/wp-json/contact-form-7/v1/contact-forms/${config.formId}/feedback`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    // A timeout means we don't know if WordPress sent the mail. Never report it as a failure.
    if (err instanceof DOMException && err.name === "TimeoutError") return { status: "unknown" };
    return { status: "unavailable" };
  }

  if (res.status >= 500) return { status: "unavailable" };

  let data: Cf7Response;
  try {
    data = (await res.json()) as Cf7Response;
  } catch {
    return { status: "unavailable" };
  }

  if (data.status === "mail_sent") {
    return { status: "sent", message: data.message ?? "" };
  }

  if (data.status === "validation_failed" || data.status === "spam") {
    const fields: Partial<Record<EnquiryField, string>> = {};
    for (const f of data.invalid_fields ?? []) {
      const key = f.field ? FIELD_FROM_CF7[f.field] : undefined;
      if (key && f.message) fields[key] = f.message;
    }
    return { status: "rejected", message: data.message ?? "", fields };
  }

  // mail_failed / aborted / anything new: the form was processed but mail did not go out.
  return { status: "unavailable" };
}
