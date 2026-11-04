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
