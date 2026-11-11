import { submitEnquiry } from "@/features/enquiry/server/submit-enquiry";

const MAX_BODY_BYTES = 8_192;

/** Transport only: size limit → parse → use case → HTTP response. */
export async function POST(request: Request): Promise<Response> {
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

  // Behind Vercel/most proxies the first x-forwarded-for entry is the client.
  const clientKey = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const result = await submitEnquiry(raw, clientKey);

  return Response.json(result.body, {
    status: result.status,
    headers: {
      "cache-control": "no-store",
      ...(result.retryAfterSec ? { "retry-after": String(result.retryAfterSec) } : {}),
    },
  });
}
