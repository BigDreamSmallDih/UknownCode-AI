export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the caller may try again (0 when allowed). */
  retryAfterSec: number;
}

/**
 * Fixed-window limiter kept in memory. Protects the server's AI provider key from a single
 * user. It resets on restart and is per-instance, which is fine for a single small server.
 */
export class FixedWindowLimiter {
  private readonly windows = new Map<string, { start: number; count: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string): RateLimitResult {
    const now = this.now();
    this.prune(now);

    const entry = this.windows.get(key);
    if (!entry || now - entry.start >= this.windowMs) {
      this.windows.set(key, { start: now, count: 1 });
      return { allowed: true, retryAfterSec: 0 };
    }
    if (entry.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((entry.start + this.windowMs - now) / 1000)),
      };
    }
    entry.count += 1;
    return { allowed: true, retryAfterSec: 0 };
  }

  private prune(now: number): void {
    if (this.windows.size < 1000) return;
    for (const [key, entry] of this.windows) {
      if (now - entry.start >= this.windowMs) this.windows.delete(key);
    }
  }
}
