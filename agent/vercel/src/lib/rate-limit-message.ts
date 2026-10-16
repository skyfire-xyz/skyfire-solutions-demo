/**
 * Client-safe rate limit formatting.
 *
 * Deliberately NOT inside src/lib/rate-limit/, whose index imports
 * `next/headers`. Keeping this separate means a client component can import it
 * without dragging server-only code into the browser bundle.
 */

export interface RateLimitDisplayPayload {
  code?: string;
  scope?: string;
  message?: string;
  retryAt?: string | null;
  retryAfterSeconds?: number;
}

export function isRateLimited(parsed: unknown): parsed is RateLimitDisplayPayload {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    (parsed as { code?: unknown }).code === "rate_limited"
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 90) return "less than a minute";
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `about ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  return `about ${hours} hour${hours === 1 ? "" : "s"}`;
}

/**
 * Composed on the client on purpose: the server runs in UTC on Render, so only
 * the browser knows what "5:42 PM" means to this user. Runs after a user
 * action, never during SSR, so there is no hydration mismatch.
 */
export function formatRateLimitMessage(payload: RateLimitDisplayPayload): string {
  const base = payload.message ?? "Rate limit reached.";
  if (!payload.retryAt) return base;

  const at = new Date(payload.retryAt);
  if (Number.isNaN(at.getTime())) return base;

  const clock = at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const relative = payload.retryAfterSeconds
    ? ` (${formatDuration(payload.retryAfterSeconds)})`
    : "";
  return `${base} Access returns at ${clock}${relative}.`;
}
