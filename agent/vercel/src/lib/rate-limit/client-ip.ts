import { getRateLimitConfig } from "./config";
import { normalizeIp } from "./ip";

/**
 * Structural, not `next/headers`' ReadonlyHeaders, so the verification script
 * can hand this a plain `new Headers({...})`.
 */
export interface HeaderReader {
  get(name: string): string | null;
  has(name: string): boolean;
}

export type ClientIpSource =
  | "cf-connecting-ip"
  | "true-client-ip"
  | "x-forwarded-for"
  | "dev-fallback";

export interface ClientIpResult {
  ip: string;
  source: ClientIpSource;
}

/**
 * Deployment shape: client -> Cloudflare -> Render proxy -> this app.
 *
 * Render's proxy APPENDS to X-Forwarded-For and does not strip a
 * client-supplied value, so the left-hand entries of that header are entirely
 * attacker-controlled. `xff.split(",")[0]` -- the usual tutorial line -- lets
 * anyone defeat the limiter by rotating a fake header per request.
 *
 * Only the right-hand end of the chain was written by infrastructure we
 * control, and even that needs hop counting: the very last entry may be
 * Cloudflare's edge IP rather than the visitor, which would bucket every
 * visitor into one key -- mass over-blocking, the opposite failure.
 *
 * Hence the order below: Cloudflare's own headers (which Cloudflare
 * overwrites, so they cannot be forged through it) first, X-Forwarded-For only
 * as a fallback, and the hop count tunable without a code change. Calibrate it
 * against real traffic with RATE_LIMIT_DEBUG_HEADERS.
 */
export function resolveClientIp(headers: HeaderReader): ClientIpResult | null {
  const config = getRateLimitConfig();

  const cf = normalizeIp(headers.get("cf-connecting-ip"));
  if (cf) return { ip: cf, source: "cf-connecting-ip" };

  // Cloudflare Enterprise only -- harmless to check, don't expect it.
  const trueClient = normalizeIp(headers.get("true-client-ip"));
  if (trueClient) return { ip: trueClient, source: "true-client-ip" };

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const index = parts.length - 1 - config.trustedProxyHops;
    const candidate = index >= 0 ? normalizeIp(parts[index]) : null;
    if (candidate) return { ip: candidate, source: "x-forwarded-for" };
  }

  // Double-gated: only outside production, and only when explicitly set. A
  // NODE_ENV-only gate would collapse all production traffic into one bucket
  // on a misconfiguration.
  if (config.devFallbackIp && process.env.NODE_ENV !== "production") {
    return { ip: config.devFallbackIp, source: "dev-fallback" };
  }

  return null;
}

/** One-shot diagnostic for calibrating trustedProxyHops against real traffic. */
export function describeIpHeaders(headers: HeaderReader): Record<string, unknown> {
  return {
    cfConnectingIp: headers.get("cf-connecting-ip"),
    trueClientIp: headers.get("true-client-ip"),
    xForwardedFor: headers.get("x-forwarded-for"),
  };
}
