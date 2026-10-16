import { normalizeIp } from "./ip";

export interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
  /** 0 disables the sticky block. */
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

// Limits come from the environment. These are only a strict safety net for a
// missing or invalid value, not the deployed configuration.
const FALLBACK = {
  maxRequests: 3,
  windowMs: 30 * 60 * 1000,
  blockMs: 30 * 60 * 1000,
  globalMaxRequests: 20,
  maxTrackedIps: 20_000,
  maxTrackedBlocks: 5_000,
} as const;

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  console.warn(`[rate-limit] ${name} is not a boolean; using ${fallback}`);
  return fallback;
}

function readInt(name: string, fallback: number, min = 0): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min) {
    console.warn(`[rate-limit] ${name} is not a valid integer; using fallback`);
    return fallback;
  }
  return value;
}

function readAllowlist(): ReadonlySet<string> {
  const out = new Set<string>();
  for (const entry of (process.env.RATE_LIMIT_ALLOWLIST ?? "").split(",")) {
    if (!entry.trim()) continue;
    const normalized = normalizeIp(entry);
    if (normalized) out.add(normalized);
    else console.warn("[rate-limit] ignoring an unparseable allowlist entry");
  }
  return out;
}

let cached: RateLimitConfig | null = null;

// Read lazily on first use so values come from the runtime environment.
export function getRateLimitConfig(): RateLimitConfig {
  if (cached) return cached;

  // Optional feature: off unless a limit is configured.
  const configured = Boolean(process.env.RATE_LIMIT_MAX_REQUESTS);

  const windowMs = readInt("RATE_LIMIT_WINDOW_MS", FALLBACK.windowMs, 1000);

  cached = Object.freeze({
    enabled: configured && readBool("RATE_LIMIT_ENABLED", true),
    perIp: Object.freeze({
      maxRequests: readInt("RATE_LIMIT_MAX_REQUESTS", FALLBACK.maxRequests, 1),
      windowMs,
      blockMs: readInt("RATE_LIMIT_BLOCK_MS", FALLBACK.blockMs, 1000),
    }),
    global: Object.freeze({
      maxRequests: readInt(
        "RATE_LIMIT_GLOBAL_MAX_REQUESTS",
        FALLBACK.globalMaxRequests,
        1,
      ),
      windowMs: readInt("RATE_LIMIT_GLOBAL_WINDOW_MS", windowMs, 1000),
      blockMs: 0,
    }),
    globalEnabled: readBool(
      "RATE_LIMIT_GLOBAL_ENABLED",
      Boolean(process.env.RATE_LIMIT_GLOBAL_MAX_REQUESTS),
    ),
    maxTrackedIps: readInt("RATE_LIMIT_MAX_TRACKED_IPS", FALLBACK.maxTrackedIps, 100),
    maxTrackedBlocks: readInt(
      "RATE_LIMIT_MAX_TRACKED_BLOCKS",
      FALLBACK.maxTrackedBlocks,
      100,
    ),
    trustedProxyHops: readInt("RATE_LIMIT_TRUSTED_PROXY_HOPS", 0, 0),
    debugHeaders: readBool("RATE_LIMIT_DEBUG_HEADERS", false),
    allowlist: readAllowlist(),
    devFallbackIp:
      process.env.NODE_ENV !== "production"
        ? normalizeIp(process.env.RATE_LIMIT_DEV_FALLBACK_IP)
        : null,
  });

  // Server logs only; lets the operator confirm what loaded.
  console.log(
    "[rate-limit]",
    cached.enabled
      ? {
          perIp: cached.perIp,
          global: cached.globalEnabled ? cached.global : "off",
          allowlistSize: cached.allowlist.size,
        }
      : "disabled (not configured)",
  );

  return cached;
}

/** Test helper. */
export function __resetRateLimitConfig(): void {
  cached = null;
}
