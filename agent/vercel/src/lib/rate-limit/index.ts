import { headers } from "next/headers";

import { describeIpHeaders, resolveClientIp } from "./client-ip";
import { getRateLimitConfig } from "./config";
import { GLOBAL_KEY, getRateLimitStore } from "./store";

export type RateLimitScope = "ip" | "global";

export interface RateLimitVerdict {
  allowed: boolean;
  retryAt?: number;
  scope?: RateLimitScope;
}

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "unknown error";

/** Call once per user submission, from `getAgent`. */
export async function checkRateLimit(): Promise<RateLimitVerdict> {
  const config = getRateLimitConfig();
  if (!config.enabled) return { allowed: true };

  const store = getRateLimitStore();
  const requestHeaders = await headers();
  const resolved = resolveClientIp(requestHeaders);

  if (config.debugHeaders) {
    console.log("[rate-limit] headers", {
      ...describeIpHeaders(requestHeaders),
      resolved,
    });
  }

  const allowlisted = resolved !== null && config.allowlist.has(resolved.ip);

  try {
    if (config.globalEnabled && !allowlisted) {
      const globalDecision = await store.consume(GLOBAL_KEY, Date.now(), config.global);
      if (!globalDecision.allowed) {
        console.warn("[rate-limit] global limit reached");
        return { allowed: false, retryAt: globalDecision.retryAt, scope: "global" };
      }
    }

    if (!resolved) {
      console.warn("[rate-limit] client ip unresolved");
      return { allowed: true };
    }

    if (allowlisted) return { allowed: true };

    const decision = await store.consume(resolved.ip, Date.now(), config.perIp);
    if (decision.allowed) return { allowed: true };

    if (decision.justBlocked) {
      console.warn(`[rate-limit] blocked ${resolved.ip} (${resolved.source})`);
    }
    return { allowed: false, retryAt: decision.retryAt, scope: "ip" };
  } catch (err) {
    console.error("[rate-limit] store error:", errorMessage(err));
    return { allowed: true };
  }
}

export interface RateLimitedPayload {
  error: true;
  code: "rate_limited";
  scope: RateLimitScope;
  message: string;
  retryAt: string | null;
  retryAfterSeconds: number;
  answer: string;
  steps: never[];
  usage: { promptTokens: 0; completionTokens: 0; totalTokens: 0 };
}

// Deliberately omits `agentContext` so the client keeps its existing state.
export function buildRateLimitedPayload(
  retryAt?: number,
  scope: RateLimitScope = "ip",
): RateLimitedPayload {
  const config = getRateLimitConfig();
  const rule = scope === "global" ? config.global : config.perIp;
  const fallbackMs = rule.blockMs > 0 ? rule.blockMs : rule.windowMs;
  const retryAfterSeconds = retryAt
    ? Math.max(1, Math.ceil((retryAt - Date.now()) / 1000))
    : Math.ceil(fallbackMs / 1000);

  const message =
    scope === "global"
      ? "This demo is temporarily at capacity because of unusually high traffic."
      : "You have reached the usage limit for your network.";

  return {
    error: true,
    code: "rate_limited",
    scope,
    message,
    retryAt: retryAt ? new Date(retryAt).toISOString() : null,
    retryAfterSeconds,
    answer: "",
    steps: [],
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
  };
}
