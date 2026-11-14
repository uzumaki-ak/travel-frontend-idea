import "server-only";
import { serverEnv } from "@/config/server-env";
import { home } from "@/content/home";
import type { EnquiryResponse } from "../enquiry.schema";
import type { DeliveryResult } from "./cf7-gateway";
import { recallOutcome, rememberOutcome, takeRateLimit } from "./request-guards";

export type SubmitResult = { status: number; body: EnquiryResponse; retryAfterSec?: number };

const PHONE_FALLBACK = `Please WhatsApp or call us on ${home.contact.call.value}.`;

export function validationFailed(fields: Record<string, string>): SubmitResult {
  return {
    status: 422,
    body: { ok: false, error: { code: "VALIDATION_ERROR", message: "Please check the highlighted fields.", fields } },
  };
}

/**
 * Shared steps for every enquiry form, after validation:
 * honeypot → de-duplicate → rate limit → configured? → deliver → describe truthfully.
 */
export async function runEnquiry(input: {
  submissionId: string;
  honeypot: string;
  clientKey: string;
  deliver: (origin: string) => Promise<DeliveryResult>;
}): Promise<SubmitResult> {
  // Honeypot filled: answer like a success so bots learn nothing, but send nothing.
  if (input.honeypot) return { status: 200, body: { ok: true, message: "Thank you for your message." } };

  const previous = recallOutcome<SubmitResult>(input.submissionId);
  if (previous) return previous;

  const limit = takeRateLimit(input.clientKey);
  if (!limit.allowed) {
    return {
      status: 429,
      retryAfterSec: limit.retryAfterSec,
      body: { ok: false, error: { code: "RATE_LIMITED", message: `Too many enquiries in a short time. ${PHONE_FALLBACK}` } },
    };
  }

  if (!serverEnv.ENQUIRY_CF7_ORIGIN) {
    return {
      status: 503,
      body: { ok: false, error: { code: "NOT_CONFIGURED", message: `Online enquiries aren't connected yet. ${PHONE_FALLBACK}` } },
    };
  }

  const delivery = await input.deliver(serverEnv.ENQUIRY_CF7_ORIGIN);
  const result = describe(delivery);
  // Only settled outcomes are replayed; failures may be retried with the same id.
  if (result.body.ok || delivery.status === "unknown") rememberOutcome(input.submissionId, result);
  return result;
}

function describe(delivery: DeliveryResult): SubmitResult {
  switch (delivery.status) {
    case "sent":
      return { status: 200, body: { ok: true, message: delivery.message || "Thank you for your message. It has been sent." } };
    case "rejected":
      return {
        status: 422,
        body: {
          ok: false,
          error: { code: "UPSTREAM_REJECTED", message: delivery.message || "Please check the highlighted fields.", fields: delivery.fields },
        },
      };
    case "unknown":
      return {
        status: 504,
        body: {
          ok: false,
          error: { code: "OUTCOME_UNKNOWN", message: `Your query may have been received, but we couldn't confirm it. ${PHONE_FALLBACK}` },
        },
      };
    case "unavailable":
      return {
        status: 502,
        body: { ok: false, error: { code: "UPSTREAM_UNAVAILABLE", message: `We couldn't send your query just now. ${PHONE_FALLBACK}` } },
      };
  }
}
