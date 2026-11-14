import "server-only";
import { serverEnv } from "@/config/server-env";
import { siteConfig } from "@/config/site";
import { tourTitle } from "@/content/tours";
import { enquirySchema, fieldErrors } from "../enquiry.schema";
import { deliverToCf7 } from "./cf7-gateway";
import { runEnquiry, validationFailed, type SubmitResult } from "./enquiry-flow";

export type { SubmitResult } from "./enquiry-flow";

/** General and tour query forms. */
export async function submitEnquiry(raw: unknown, clientKey: string): Promise<SubmitResult> {
  const parsed = enquirySchema.safeParse(raw);
  if (!parsed.success) return validationFailed(fieldErrors(parsed.error));
  const enquiry = parsed.data;

  // The browser only says which tour; the form id, package name and link come from our own data.
  const tour = enquiry.tourSlug ? tourTitle(enquiry.tourSlug) : null;

  return runEnquiry({
    submissionId: enquiry.submissionId,
    honeypot: enquiry.website,
    clientKey,
    deliver: (origin) =>
      deliverToCf7(
        enquiry,
        tour
          ? {
              origin,
              formId: serverEnv.ENQUIRY_CF7_TOUR_FORM_ID,
              pageUrl: `${siteConfig.url}/tours/${enquiry.tourSlug}/`,
              packageName: tour,
            }
          : { origin, formId: serverEnv.ENQUIRY_CF7_FORM_ID, pageUrl: `${siteConfig.url}/` },
      ),
  });
}
