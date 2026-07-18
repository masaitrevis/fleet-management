interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();

  checkLimit(identifier: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry) {
      this.store.set(identifier, { timestamps: [now] });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }

    // Remove timestamps outside the window (sliding window)
    const windowStart = now - windowMs;
    const validTimestamps = entry.timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= limit) {
      const resetAt = validTimestamps[0] + windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }

    validTimestamps.push(now);
    this.store.set(identifier, { timestamps: validTimestamps });

    return {
      allowed: true,
      remaining: limit - validTimestamps.length,
      resetAt: now + windowMs,
    };
  }

  reset(identifier: string): void {
    this.store.delete(identifier);
  }

  clear(): void {
    this.store.clear();
  }
}

export const rateLimiter = new InMemoryRateLimiter();
export { InMemoryRateLimiter };
export type { RateLimitResult };
