import "server-only";
import type { SubmitResult } from "./enquiry-flow";

const MAX_BODY_BYTES = 8_192;

/** Transport for every enquiry endpoint: size limit → JSON parse → use case → HTTP response. */
export async function handleEnquiryRequest(
  request: Request,
  submit: (raw: unknown, clientKey: string) => Promise<SubmitResult>,
): Promise<Response> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return Response.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "This enquiry is too large to send." } },
      { status: 413 },
    );
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) throw new Error("too large");
    raw = JSON.parse(text);
  } catch {
    return Response.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "We couldn't read this enquiry. Please try again." } },
      { status: 400 },
    );
  }

  // nginx overwrites X-Forwarded-For with the real client address, so the first entry is trustworthy.
  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const result = await submit(raw, clientKey);

  return Response.json(result.body, {
    status: result.status,
    headers: {
      "cache-control": "no-store",
      ...(result.retryAfterSec ? { "retry-after": String(result.retryAfterSec) } : {}),
    },
  });
}
