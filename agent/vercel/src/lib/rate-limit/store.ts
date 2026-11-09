import { getRateLimitConfig, type RateLimitConfig, type RateLimitRule } from "./config";

export interface RateLimitDecision {
  allowed: boolean;
  retryAt?: number;
  justBlocked?: boolean;
  remaining: number;
}

export const GLOBAL_KEY = "__global__";

/**
 * Storage backend. `consume` must be atomic; swap the implementation in
 * `getRateLimitStore()` to use a shared store.
 */
export interface RateLimitStore {
  readonly name: string;
  consume(key: string, now: number, rule: RateLimitRule): Promise<RateLimitDecision>;
  reset(key?: string): Promise<void>;
  stats(): { trackedKeys: number; blockedKeys: number };
}

const SWEEP_EVERY_N_CALLS = 64;
const SWEEP_MIN_INTERVAL_MS = 5 * 60 * 1000;

export class MemoryRateLimitStore implements RateLimitStore {
  readonly name = "memory";

  private readonly hits = new Map<string, number[]>();
  private readonly blocks = new Map<string, number>();
  private callsSinceSweep = 0;
  private lastSweepAt = 0;

  constructor(private readonly config: RateLimitConfig) {}

  async consume(
    key: string,
    now: number,
    rule: RateLimitRule,
  ): Promise<RateLimitDecision> {
    // No `await` below: keeps the read-modify-write atomic.
    this.maybeSweep(now);

    const blockedUntil = this.blocks.get(key);
    if (blockedUntil !== undefined) {
      if (blockedUntil > now) {
        this.touch(this.blocks, key, blockedUntil);
        return { allowed: false, retryAt: blockedUntil, remaining: 0 };
      }
      this.blocks.delete(key);
    }

    const windowStart = now - rule.windowMs;
    const previous = this.hits.get(key);
    const recent = previous ? previous.filter((t) => t > windowStart) : [];

    if (recent.length >= rule.maxRequests) {
      if (rule.blockMs <= 0) {
        this.touch(this.hits, key, recent);
        return { allowed: false, retryAt: recent[0] + rule.windowMs, remaining: 0 };
      }

      const retryAt = now + rule.blockMs;
      this.touch(this.blocks, key, retryAt);
      // Reset the log so access returns cleanly once the block ends.
      this.hits.delete(key);
      this.enforceCap(this.blocks, this.config.maxTrackedBlocks);
      return { allowed: false, retryAt, justBlocked: true, remaining: 0 };
    }

    recent.push(now);
    this.touch(this.hits, key, recent);
    this.enforceCap(this.hits, this.config.maxTrackedIps);
    return { allowed: true, remaining: rule.maxRequests - recent.length };
  }

  async reset(key?: string): Promise<void> {
    if (key === undefined) {
      this.hits.clear();
      this.blocks.clear();
      return;
    }
    this.hits.delete(key);
    this.blocks.delete(key);
  }

  stats() {
    return { trackedKeys: this.hits.size, blockedKeys: this.blocks.size };
  }

  private touch<T>(map: Map<string, T>, key: string, value: T): void {
    map.delete(key);
    map.set(key, value);
  }

  private maybeSweep(now: number): void {
    this.callsSinceSweep += 1;
    const due =
      this.callsSinceSweep >= SWEEP_EVERY_N_CALLS ||
      now - this.lastSweepAt >= SWEEP_MIN_INTERVAL_MS;
    if (!due) return;

    this.callsSinceSweep = 0;
    this.lastSweepAt = now;

    const windowStart = now - this.config.perIp.windowMs;
    for (const [key, timestamps] of this.hits) {
      if (key === GLOBAL_KEY) continue;
      const newest = timestamps[timestamps.length - 1];
      if (newest === undefined || newest <= windowStart) this.hits.delete(key);
    }
    for (const [key, until] of this.blocks) {
      if (until <= now) this.blocks.delete(key);
    }
  }

  private enforceCap(map: Map<string, unknown>, cap: number): void {
    if (map.size <= cap) return;
    let over = map.size - cap;
    for (const key of map.keys()) {
      if (key === GLOBAL_KEY) continue;
      map.delete(key);
      if (--over === 0) break;
    }
  }
}

// Held on globalThis so dev-mode module reloads don't reset the counters.
const STORE_KEY = Symbol.for("skyfire.rateLimit.store.v1");

type GlobalWithStore = typeof globalThis & { [STORE_KEY]?: RateLimitStore };

export function getRateLimitStore(): RateLimitStore {
  const g = globalThis as GlobalWithStore;
  let store = g[STORE_KEY];
  if (!store) {
    store = new MemoryRateLimitStore(getRateLimitConfig());
    g[STORE_KEY] = store;
  }
  return store;
}
