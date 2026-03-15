import type { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

/**
 * RateLimiter — In-memory token bucket rate limiter.
 *
 * Limits requests per minute per API key or IP address.
 * For production use, replace with Redis-backed implementation.
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private buckets: Map<string, RateLimitBucket> = new Map();
  private readonly windowMs = 60_000; // 1 minute window

  private constructor() {
    // Purge expired buckets every 5 minutes
    setInterval(() => this.purgeExpired(), 5 * 60_000);
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  check(key: string, limit: number): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
    }

    bucket.count++;

    return {
      allowed: bucket.count <= limit,
      remaining: Math.max(0, limit - bucket.count),
      resetAt: bucket.resetAt,
    };
  }

  middleware(defaultLimit = 60) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const key =
        (request.headers['x-api-key'] as string) ??
        request.ip ??
        'anonymous';

      const result = this.check(key, defaultLimit);

      reply.header('X-RateLimit-Limit', defaultLimit);
      reply.header('X-RateLimit-Remaining', result.remaining);
      reply.header('X-RateLimit-Reset', Math.floor(result.resetAt / 1000));

      if (!result.allowed) {
        reply.code(429).send({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Retry after ${new Date(result.resetAt).toISOString()}`,
          resetAt: result.resetAt,
        });
      }
    };
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetAt) this.buckets.delete(key);
    }
  }
}
