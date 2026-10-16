import { normalizeIp } from "./ip";

/** One limiting rule: how many requests, over what window, blocked for how long. */
export interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
  /**
   * Sticky block duration once the window is exceeded. 0 means "no sticky
   * block": the request is denied while the window is full and access returns
   * on its own as the oldest hit ages out. The global breaker uses 0 so a
   * traffic spike cannot take the demo down for hours.
   */
  blockMs: number;
}

export interface RateLimitConfig {
  enabled: boolean;
  perIp: RateLimitRule;
  global: RateLimitRule;
  globalEnabled: boolean;
  maxTrackedIps: number;
  maxTrackedBlocks: number;
  trustedProxyHops: number;
  debugHeaders: boolean;
  allowlist: ReadonlySet<string>;
  devFallbackIp: string | null;
}

const DEFAULTS = {
  enabled: true,
  maxRequests: 10,
  windowMs: 60 * 60 * 1000,
  blockMs: 3 * 60 * 60 * 1000,
  globalEnabled: true,
  globalMaxRequests: 100,
  maxTrackedIps: 20_000,
  maxTrackedBlocks: 5_000,
  trustedProxyHops: 0,
} as const;

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = raw.trim().toLowerCase();
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  console.warn(`[rate-limit] ${name}="${raw}" is not a boolean; using ${fallback}`);
  return fallback;
}

function readInt(name: string, fallback: number, min = 0): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < min) {
    console.warn(
      `[rate-limit] ${name}="${raw}" is not an integer >= ${min}; using ${fallback}`,
    );
    return fallback;
  }
  return value;
}

function readAllowlist(): ReadonlySet<string> {
  const raw = process.env.RATE_LIMIT_ALLOWLIST ?? "";
  const out = new Set<string>();
  for (const entry of raw.split(",")) {
    if (!entry.trim()) continue;
    // Normalized through the same function as the request path, so an
    // allowlisted IPv6 address exempts its whole /64 -- intended: that is one
    // teammate's connection.
    const normalized = normalizeIp(entry);
    if (!normalized) {
      console.warn(
        `[rate-limit] ignoring unparseable RATE_LIMIT_ALLOWLIST entry "${entry.trim()}"`,
      );
      continue;
    }
    out.add(normalized);
  }
  return out;
}

let cached: RateLimitConfig | null = null;

/**
 * Read lazily, not at module scope. The Docker build runs `yarn build` without
 * the runtime env, and anything read at module-eval time risks being baked in
 * as a default. The first call happens on the first request, on the server,
 * with the real Render environment present.
 */
export function getRateLimitConfig(): RateLimitConfig {
  if (cached) return cached;

  const devFallbackIp =
    process.env.NODE_ENV !== "production"
      ? normalizeIp(process.env.RATE_LIMIT_DEV_FALLBACK_IP)
      : null;

  const windowMs = readInt("RATE_LIMIT_WINDOW_MS", DEFAULTS.windowMs, 1000);

  cached = Object.freeze({
    enabled: readBool("RATE_LIMIT_ENABLED", DEFAULTS.enabled),
    perIp: Object.freeze({
      maxRequests: readInt("RATE_LIMIT_MAX_REQUESTS", DEFAULTS.maxRequests, 1),
      windowMs,
      blockMs: readInt("RATE_LIMIT_BLOCK_MS", DEFAULTS.blockMs, 1000),
    }),
    global: Object.freeze({
      maxRequests: readInt(
        "RATE_LIMIT_GLOBAL_MAX_REQUESTS",
        DEFAULTS.globalMaxRequests,
        1,
      ),
      windowMs: readInt("RATE_LIMIT_GLOBAL_WINDOW_MS", windowMs, 1000),
      // No sticky block on purpose: the breaker should ease off by itself as
      // the window slides, not lock everyone out for hours.
      blockMs: 0,
    }),
    globalEnabled: readBool("RATE_LIMIT_GLOBAL_ENABLED", DEFAULTS.globalEnabled),
    maxTrackedIps: readInt("RATE_LIMIT_MAX_TRACKED_IPS", DEFAULTS.maxTrackedIps, 100),
    maxTrackedBlocks: readInt(
      "RATE_LIMIT_MAX_TRACKED_BLOCKS",
      DEFAULTS.maxTrackedBlocks,
      100,
    ),
    trustedProxyHops: readInt(
      "RATE_LIMIT_TRUSTED_PROXY_HOPS",
      DEFAULTS.trustedProxyHops,
      0,
    ),
    debugHeaders: readBool("RATE_LIMIT_DEBUG_HEADERS", false),
    allowlist: readAllowlist(),
    devFallbackIp,
  });

  console.log("[rate-limit] active config", {
    enabled: cached.enabled,
    maxRequests: cached.perIp.maxRequests,
    windowMinutes: Math.round(cached.perIp.windowMs / 60000),
    blockMinutes: Math.round(cached.perIp.blockMs / 60000),
    globalEnabled: cached.globalEnabled,
    globalMaxRequests: cached.global.maxRequests,
    trustedProxyHops: cached.trustedProxyHops,
    allowlistSize: cached.allowlist.size, // count only; entries are teammates' IPs
    devFallbackIp: cached.devFallbackIp,
  });

  return cached;
}

/** Verification-script helper; not used by application code. */
export function __resetRateLimitConfig(): void {
  cached = null;
}
