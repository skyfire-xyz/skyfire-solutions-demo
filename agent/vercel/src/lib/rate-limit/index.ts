import { headers } from "next/headers";

import { describeIpHeaders, resolveClientIp } from "./client-ip";
import { getRateLimitConfig } from "./config";
import { GLOBAL_KEY, getRateLimitStore } from "./store";

export type RateLimitScope = "ip" | "global";

export interface RateLimitVerdict {
  allowed: boolean;
  /** epoch ms when access returns; present only when allowed === false */
  retryAt?: number;
  /** which cap denied the request; present only when allowed === false */
  scope?: RateLimitScope;
}

/** Same rule as actions.tsx -- never log a raw error object; it can carry headers. */
const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "unknown error";

/**
 * Evaluate and record one user submission.
 *
 * MUST be called from getAgent (the server action), never from runAgent:
 * runAgent recurses when the model calls connect-mcp-server-tool, and one user
 * submission has to cost exactly one token.
 */
export async function checkRateLimit(): Promise<RateLimitVerdict> {
  const config = getRateLimitConfig();
  if (!config.enabled) return { allowed: true };

  const store = getRateLimitStore();

  const requestHeaders = await headers(); // async in Next 15
  const resolved = resolveClientIp(requestHeaders);

  if (config.debugHeaders) {
    console.log("[rate-limit] header debug", {
      ...describeIpHeaders(requestHeaders),
      resolved,
    });
  }

  const allowlisted = resolved !== null && config.allowlist.has(resolved.ip);

  try {
    // The service-wide breaker runs first and does not need an IP, so it still
    // caps total spend when IP resolution fails open below. Allowlisted IPs
    // skip it too, so the team is never locked out by someone else's flood.
    if (config.globalEnabled && !allowlisted) {
      const globalDecision = await store.consume(GLOBAL_KEY, Date.now(), config.global);
      if (!globalDecision.allowed) {
        console.warn(
          `[rate-limit] global cap of ${config.global.maxRequests} reached; ` +
            `denying until ${new Date(globalDecision.retryAt!).toISOString()}`,
        );
        return { allowed: false, retryAt: globalDecision.retryAt, scope: "global" };
      }
    }

    if (!resolved) {
      // Fail open. Taking the whole demo down the moment a proxy changes header
      // shape is worse than the spend risk, which the breaker above still caps.
      console.warn("[rate-limit] no trustworthy client IP; allowing request", {
        hasCfConnectingIp: requestHeaders.has("cf-connecting-ip"),
        hasTrueClientIp: requestHeaders.has("true-client-ip"),
        xffEntryCount: requestHeaders.get("x-forwarded-for")?.split(",").length ?? 0,
      });
      return { allowed: true };
    }

    // Checked before counting, so an allowlisted IP is never counted and is
    // released even if it was blocked before being added to the list.
    if (allowlisted) return { allowed: true };

    const decision = await store.consume(resolved.ip, Date.now(), config.perIp);
    if (decision.allowed) return { allowed: true };

    if (decision.justBlocked) {
      console.warn(
        `[rate-limit] blocking ${resolved.ip} (via ${resolved.source}) until ` +
          `${new Date(decision.retryAt!).toISOString()} after ` +
          `${config.perIp.maxRequests} runs`,
      );
    }
    return { allowed: false, retryAt: decision.retryAt, scope: "ip" };
  } catch (err) {
    console.error("[rate-limit] store error; allowing request:", errorMessage(err));
    return { allowed: true };
  }
}

export interface RateLimitedPayload {
  error: true;
  code: "rate_limited";
  scope: RateLimitScope;
  message: string;
  /** ISO 8601, or null if unknown. Formatted for display on the CLIENT. */
  retryAt: string | null;
  retryAfterSeconds: number;
  /** Fields below exist so every existing reader stays on its happy path. */
  answer: string;
  steps: never[];
  usage: { promptTokens: 0; completionTokens: 0; totalTokens: 0 };
}

/**
 * Note what is NOT here: `agentContext`. index.tsx assigns
 * `parsed.agentContext` on every response, and handing back `undefined` would
 * wipe the user's conversation history and any dynamically mounted seller
 * server. The client guards on presence instead.
 *
 * Note also that `message` carries no clock time. The server runs in UTC on
 * Render; the local "access returns at HH:MM" is composed client-side.
 */
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
      ? "This demo is temporarily at capacity because of unusually high traffic. " +
        "Each run spends real funds, so there is a cap on how many run at once."
      : `You have reached the limit of ${config.perIp.maxRequests} agent runs per hour ` +
        `for your network. Each run spends real funds, so this cap keeps the demo ` +
        `available for everyone.`;

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
