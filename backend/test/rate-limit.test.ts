import { describe, expect, it } from 'vitest';
import { FixedWindowLimiter } from '../src/lib/rate-limit.js';

describe('FixedWindowLimiter', () => {
  it('allows up to the limit then blocks with a retry hint', () => {
    let now = 1_000;
    const limiter = new FixedWindowLimiter(2, 10_000, () => now);

    expect(limiter.check('u').allowed).toBe(true);
    expect(limiter.check('u').allowed).toBe(true);
    const blocked = limiter.check('u');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(10);

    now += 4_000;
    expect(limiter.check('u').retryAfterSec).toBe(6);
  });

  it('resets after the window and tracks users separately', () => {
    let now = 0;
    const limiter = new FixedWindowLimiter(1, 1_000, () => now);

    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('b').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);

    now = 1_000;
    expect(limiter.check('a').allowed).toBe(true);
  });
});
