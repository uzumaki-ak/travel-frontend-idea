import "server-only";
import { serverEnv } from "@/config/server-env";
import { cabForm } from "@/content/cabs";
import { postToCf7 } from "@/features/enquiry/server/cf7-gateway";
import { runEnquiry, validationFailed, type SubmitResult } from "@/features/enquiry/server/enquiry-flow";
import { cabFieldErrors, makeCabEnquirySchema } from "../cab-enquiry.schema";

const schema = makeCabEnquirySchema({
  locations: cabForm.pickup.options,
  times: cabForm.time.options,
  vehicles: cabForm.vehicle.options,
  countryCodes: cabForm.countryCodes,
  maxYearsAhead: cabForm.dateRule.maxYearsAhead,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2026-11-14` → `14-Nov-2026`, the format the live cab date picker submits (jQuery UI "dd-M-yy"). */
function toCabDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}-${MONTHS[Number(m) - 1]}-${y}`;
}

/** Cab booking form (CF7 291) — same fields and values as the live form. */
export async function submitCabEnquiry(raw: unknown, clientKey: string): Promise<SubmitResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return validationFailed(cabFieldErrors(parsed.error));
  const b = parsed.data;

  return runEnquiry({
    submissionId: b.submissionId,
    honeypot: b.website,
    clientKey,
    deliver: (origin) =>
      postToCf7(
        { origin, formId: serverEnv.ENQUIRY_CF7_CAB_FORM_ID },
        {
          "pickup-location": b.pickup,
          "drop-location": b.drop,
          "preferred-date": toCabDate(b.date),
          "pickup-time": b.time,
          "your-name": b.name,
          "your-email": b.email,
          "country-code": b.countryCode,
          "phone-number": b.phone,
          "vehicle-type": b.vehicle,
        },
        {
          "pickup-location": "pickup",
          "drop-location": "drop",
          "preferred-date": "date",
          "pickup-time": "time",
          "your-name": "name",
          "your-email": "email",
          "country-code": "countryCode",
          "phone-number": "phone",
          "vehicle-type": "vehicle",
        },
      ),
  });
}
