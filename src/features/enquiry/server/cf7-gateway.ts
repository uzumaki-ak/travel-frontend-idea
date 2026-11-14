import "server-only";
import type { Enquiry } from "../enquiry.schema";

/**
 * Vendor adapter: posts a form to the existing WordPress Contact Form 7, so
 * mail keeps arriving exactly where it does today. CF7 field names come from
 * the live form markup.
 */

const TIMEOUT_MS = 10_000;

export type DeliveryResult =
  | { status: "sent"; message: string }
  | { status: "rejected"; message: string; fields: Record<string, string> }
  | { status: "unavailable" }
  | { status: "unknown" };

type Cf7Response = {
  status?: string;
  message?: string;
  invalid_fields?: { field?: string; message?: string }[];
};

/**
 * Posts `fields` (CF7 names → values) to a CF7 form. `fieldMap` translates CF7
 * field names back to our field names for validation messages.
 */
export async function postToCf7(
  config: { origin: string; formId: string },
  fields: Record<string, string>,
  fieldMap: Record<string, string>,
): Promise<DeliveryResult> {
  const body = new FormData();
  body.set("_wpcf7", config.formId);
  body.set("_wpcf7_unit_tag", `wpcf7-f${config.formId}-o1`);
  body.set("_wpcf7_container_post", "0");
  for (const [name, value] of Object.entries(fields)) body.set(name, value);

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

  if (data.status === "mail_sent") return { status: "sent", message: data.message ?? "" };

  if (data.status === "validation_failed" || data.status === "spam") {
    const out: Record<string, string> = {};
    for (const f of data.invalid_fields ?? []) {
      const key = f.field ? fieldMap[f.field] : undefined;
      if (key && f.message) out[key] = f.message;
    }
    return { status: "rejected", message: data.message ?? "", fields: out };
  }

  // mail_failed / aborted / anything new: the form was processed but mail did not go out.
  return { status: "unavailable" };
}

/** `2026-12-03` → `03-12-2026`, the day-first format the old query-form date picker produced. */
function toDayFirst(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y}`;
}

/** General / tour query form (CF7 2457 / 1295). */
export function deliverToCf7(
  enquiry: Enquiry,
  config: { origin: string; formId: string; pageUrl: string; packageName?: string },
): Promise<DeliveryResult> {
  return postToCf7(
    config,
    {
      "your-name": enquiry.name,
      "your-email": enquiry.email,
      "phone-number": enquiry.phone,
      "preferred-date": toDayFirst(enquiry.travelDate),
      "number-of-adults": String(enquiry.adults),
      "number-of-children": String(enquiry.children),
      message: enquiry.message,
      link: config.pageUrl,
      ...(config.packageName && { package: config.packageName }),
    },
    {
      "your-name": "name",
      "your-email": "email",
      "phone-number": "phone",
      "preferred-date": "travelDate",
      "number-of-adults": "adults",
      "number-of-children": "children",
      message: "message",
    },
  );
}
