import { getRateLimitConfig } from "./config";
import { normalizeIp } from "./ip";

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

export function resolveClientIp(headers: HeaderReader): ClientIpResult | null {
  const config = getRateLimitConfig();

  const cf = normalizeIp(headers.get("cf-connecting-ip"));
  if (cf) return { ip: cf, source: "cf-connecting-ip" };

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

  if (config.devFallbackIp && process.env.NODE_ENV !== "production") {
    return { ip: config.devFallbackIp, source: "dev-fallback" };
  }

  return null;
}

export function describeIpHeaders(headers: HeaderReader): Record<string, unknown> {
  return {
    cfConnectingIp: headers.get("cf-connecting-ip"),
    trueClientIp: headers.get("true-client-ip"),
    xForwardedFor: headers.get("x-forwarded-for"),
  };
}
