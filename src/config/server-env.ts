import "server-only";
import { z } from "zod";

/**
 * Server-only configuration, validated once. The only module that reads
 * private env vars.
 *
 * ENQUIRY_CF7_ORIGIN — WordPress origin whose Contact Form 7 receives enquiries
 *   (e.g. https://www.kajaawa.com). Unset = online enquiries are switched off and
 *   the form tells visitors to use WhatsApp/phone instead of pretending to send.
 * ENQUIRY_CF7_FORM_ID — CF7 form for general enquiries (the live "Query Form" is 2457).
 * ENQUIRY_CF7_TOUR_FORM_ID — CF7 form for tour pages (the live "Package Query Form" is 1295).
 */
const formId = z.string().regex(/^\d+$/);

const schema = z.object({
  ENQUIRY_CF7_ORIGIN: z.url().optional(),
  ENQUIRY_CF7_FORM_ID: formId.default("2457"),
  ENQUIRY_CF7_TOUR_FORM_ID: formId.default("1295"),
});

export const serverEnv = schema.parse({
  ENQUIRY_CF7_ORIGIN: process.env.ENQUIRY_CF7_ORIGIN || undefined,
  ENQUIRY_CF7_FORM_ID: process.env.ENQUIRY_CF7_FORM_ID || undefined,
  ENQUIRY_CF7_TOUR_FORM_ID: process.env.ENQUIRY_CF7_TOUR_FORM_ID || undefined,
});
