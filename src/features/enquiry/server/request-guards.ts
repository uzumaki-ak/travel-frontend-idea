import "server-only";

/**
 * Best-effort guards kept in process memory. On serverless hosts each instance
 * has its own memory, so these reduce abuse and accidental duplicates rather
 * than guarantee them. Put a CDN/WAF rate limit in front for real protection.
 */

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 5;
const MAX_TRACKED = 5_000;

const hits = new Map<string, { count: number; resetAt: number }>();

/** Fixed-window limit per client key (usually the IP). */
export function takeRateLimit(key: string, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    if (hits.size >= MAX_TRACKED) hits.clear();
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  return { allowed: entry.count <= MAX_PER_WINDOW, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
}

/**
 * Remembers the outcome per submission id, so a double click or a retry after
 * a lost response returns the first result instead of sending a second email.
 */
const outcomes = new Map<string, { result: unknown; expiresAt: number }>();

export function recallOutcome<T>(submissionId: string, now = Date.now()): T | undefined {
  const hit = outcomes.get(submissionId);
  if (!hit || hit.expiresAt <= now) return undefined;
  return hit.result as T;
}

export function rememberOutcome(submissionId: string, result: unknown, now = Date.now()): void {
  if (outcomes.size >= MAX_TRACKED) outcomes.clear();
  outcomes.set(submissionId, { result, expiresAt: now + WINDOW_MS });
}
