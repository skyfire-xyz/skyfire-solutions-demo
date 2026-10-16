import { getRateLimitConfig, type RateLimitConfig, type RateLimitRule } from "./config";

export interface RateLimitDecision {
  allowed: boolean;
  /** epoch ms at which access returns; present only when allowed === false */
  retryAt?: number;
  /** true only on the request that created a sticky block, so callers log once */
  justBlocked?: boolean;
  /** remaining requests in the current window; 0 when denied */
  remaining: number;
}

/**
 * Counter key for the service-wide circuit breaker. normalizeIp() only ever
 * returns real addresses, so this cannot collide with a per-IP key.
 */
export const GLOBAL_KEY = "__global__";

/**
 * THE SWAP SEAM.
 *
 * To move to Render Key Value / Redis, write a second class implementing this
 * interface and change the one line in `getRateLimitStore()`. Nothing else in
 * the codebase references the store.
 *
 * Contract a replacement must honour:
 *  1. `consume` is read-modify-write and MUST be atomic. The in-memory version
 *     gets this free because it performs no `await` between read and write and
 *     Node runs one JS task at a time. A Redis version must do it in a single
 *     Lua script (or MULTI), or two concurrent submissions from one IP can
 *     both observe count 9 and both pass.
 *  2. `now` is supplied by the caller rather than read internally, so the
 *     verification script can drive time forward without mocking Date.
 *  3. Throwing is acceptable; callers fail open and log.
 *  4. Denied calls must not record a hit and must not extend an existing block.
 */
export interface RateLimitStore {
  readonly name: string;
  consume(key: string, now: number, rule: RateLimitRule): Promise<RateLimitDecision>;
  reset(key?: string): Promise<void>;
  stats(): { trackedKeys: number; blockedKeys: number };
}

/** Full sweep at most this often, whichever trigger fires first. */
const SWEEP_EVERY_N_CALLS = 64;
const SWEEP_MIN_INTERVAL_MS = 5 * 60 * 1000;

export class MemoryRateLimitStore implements RateLimitStore {
  readonly name = "memory";

  /**
   * Sliding-window log. Map iteration order is insertion order and `consume`
   * re-inserts on every touch, which makes the front of the map the
   * least-recently-used entry -- that is the whole LRU implementation.
   */
  private readonly hits = new Map<string, number[]>();

  /** key -> epoch ms when the block lifts. Separate from `hits` on purpose. */
  private readonly blocks = new Map<string, number>();

  private callsSinceSweep = 0;
  private lastSweepAt = 0;

  constructor(private readonly config: RateLimitConfig) {}

  async consume(
    key: string,
    now: number,
    rule: RateLimitRule,
  ): Promise<RateLimitDecision> {
    // Everything from here to the return is synchronous. Do not introduce an
    // `await` -- that is what makes this atomic against concurrent requests.
    this.maybeSweep(now);

    const blockedUntil = this.blocks.get(key);
    if (blockedUntil !== undefined) {
      if (blockedUntil > now) {
        // Deliberately does NOT extend the block and does NOT record a hit. A
        // denied request costs us nothing (we return before touching OpenAI or
        // Skyfire), so there is no reason to punish hammering, and a
        // self-extending block would make the "access returns at HH:MM" we
        // show the user a lie.
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
        // No sticky block (the global breaker): deny while the window is full
        // and let access return on its own as the oldest hit ages out. Keep
        // the pruned log so that ageing actually happens.
        this.touch(this.hits, key, recent);
        return { allowed: false, retryAt: recent[0] + rule.windowMs, remaining: 0 };
      }

      const retryAt = now + rule.blockMs;
      this.touch(this.blocks, key, retryAt);
      // Clear the log. If the timestamps survived, the first request after the
      // block expired would still see maxRequests entries inside the window
      // and re-block instantly -- a permanent ban by accident.
      this.hits.delete(key);
      this.enforceCap(this.blocks, this.config.maxTrackedBlocks, "blocks");
      return { allowed: false, retryAt, justBlocked: true, remaining: 0 };
    }

    recent.push(now);
    this.touch(this.hits, key, recent);
    this.enforceCap(this.hits, this.config.maxTrackedIps, "hits");
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

  /** delete-then-set moves the key to the back: most-recently-used. */
  private touch<T>(map: Map<string, T>, key: string, value: T): void {
    map.delete(key);
    map.set(key, value);
  }

  /**
   * Traffic-driven sweep. There is deliberately NO setInterval in this file: a
   * timer keeps the libuv handle alive, so Node would not exit promptly on
   * SIGTERM and every Render redeploy would wait out the kill timeout. It
   * would also keep firing on an idle container for no benefit, and `next dev`
   * HMR would leave a second interval ticking against a stale Map. Sweeping on
   * the request path costs O(size) at most once per 64 requests.
   */
  private maybeSweep(now: number): void {
    this.callsSinceSweep += 1;
    const due =
      this.callsSinceSweep >= SWEEP_EVERY_N_CALLS ||
      now - this.lastSweepAt >= SWEEP_MIN_INTERVAL_MS;
    if (!due) return;

    this.callsSinceSweep = 0;
    this.lastSweepAt = now;

    // Uses the per-IP window: the global entry is touched on every request and
    // so is never stale in practice.
    const windowStart = now - this.config.perIp.windowMs;
    // Deleting during Map iteration is well-defined in JS.
    for (const [key, timestamps] of this.hits) {
      if (key === GLOBAL_KEY) continue;
      const newest = timestamps[timestamps.length - 1];
      if (newest === undefined || newest <= windowStart) this.hits.delete(key);
    }
    for (const [key, until] of this.blocks) {
      if (until <= now) this.blocks.delete(key);
    }
  }

  private enforceCap(map: Map<string, unknown>, cap: number, label: string): void {
    if (map.size <= cap) return;
    let over = map.size - cap;
    for (const key of map.keys()) {
      // Never evict the breaker's own counter; losing it would silently reset
      // the service-wide cap under exactly the flood it exists to catch.
      if (key === GLOBAL_KEY) continue;
      map.delete(key);
      if (--over === 0) break;
    }
    console.warn(
      `[rate-limit] ${label} map hit its ${cap}-key cap; evicted least-recently-used entries. ` +
        `If this is not a one-off, move to a shared store.`,
    );
  }
}

/**
 * `next dev` re-evaluates server modules on every edit. A module-level
 * `const store = new MemoryRateLimitStore()` would silently reset the counters
 * on each reload, and in some HMR shapes leave two live Maps with traffic split
 * across them. Symbol.for() reaches the cross-realm global registry, which
 * module reloading does not touch.
 *
 * Bump the version in the symbol if the stored shape ever changes.
 */
const STORE_KEY = Symbol.for("skyfire.rateLimit.store.v1");

type GlobalWithStore = typeof globalThis & { [STORE_KEY]?: RateLimitStore };

export function getRateLimitStore(): RateLimitStore {
  const g = globalThis as GlobalWithStore;
  let store = g[STORE_KEY];
  if (!store) {
    // <-- SWAP POINT: replace with `new RedisRateLimitStore(...)`
    store = new MemoryRateLimitStore(getRateLimitConfig());
    g[STORE_KEY] = store;
    console.log(`[rate-limit] initialised "${store.name}" store`);
  }
  return store;
}
