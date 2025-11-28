/**
 * Redis-based rate limiter for persistent rate limiting across instances
 * Falls back to in-memory rate limiting if Redis is unavailable
 */

import { getRedisClient } from './redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Redis-based rate limiter using sliding window algorithm
 */
export class RedisRateLimiter {
  private prefix: string;
  private windowMs: number;
  private maxRequests: number;
  private fallbackMap: Map<string, { count: number; resetAt: number }>;

  constructor(
    prefix: string,
    windowMs: number = 15 * 60 * 1000,
    maxRequests: number = 100
  ) {
    this.prefix = prefix;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.fallbackMap = new Map();
  }

  /**
   * Check if request is allowed using Redis
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();

    try {
      const redis = getRedisClient();

      // Use Lua script for atomic operations
      const luaScript = `
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local windowStart = now - window

        -- Remove old entries
        redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

        -- Count current entries
        local count = redis.call('ZCARD', key)

        if count >= limit then
          -- Get oldest entry for reset time
          local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
          local resetAt = now + window
          if #oldest > 0 then
            resetAt = tonumber(oldest[2]) + window
          end
          return {0, 0, resetAt, limit}
        end

        -- Add current request
        redis.call('ZADD', key, now, now .. '-' .. math.random())
        redis.call('PEXPIRE', key, window)

        return {1, limit - count - 1, now + window, limit}
      `;

      const result = await redis.eval(
        luaScript,
        1,
        key,
        now.toString(),
        this.windowMs.toString(),
        this.maxRequests.toString()
      ) as number[];

      return {
        allowed: result[0] === 1,
        remaining: result[1],
        resetAt: result[2],
        limit: result[3],
      };
    } catch (error) {
      // Fallback to in-memory on Redis error
      console.warn('Redis rate limit fallback to in-memory:', error);
      return this.checkFallback(identifier);
    }
  }

  /**
   * In-memory fallback when Redis is unavailable
   */
  private checkFallback(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = this.fallbackMap.get(identifier);

    // No previous requests or window expired
    if (!entry || entry.resetAt < now) {
      const resetAt = now + this.windowMs;
      this.fallbackMap.set(identifier, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt,
        limit: this.maxRequests,
      };
    }

    // Within window - check limit
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        limit: this.maxRequests,
      };
    }

    // Increment counter
    entry.count++;
    this.fallbackMap.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt,
      limit: this.maxRequests,
    };
  }

  /**
   * Reset rate limit for identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `${this.prefix}:${identifier}`;

    try {
      const redis = getRedisClient();
      await redis.del(key);
    } catch {
      // Ignore Redis errors
    }

    this.fallbackMap.delete(identifier);
  }

  /**
   * Get current stats
   */
  async getStats(): Promise<{ total: number; identifiers: string[] }> {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys(`${this.prefix}:*`);
      return {
        total: keys.length,
        identifiers: keys.map((k) => k.replace(`${this.prefix}:`, '')),
      };
    } catch {
      return {
        total: this.fallbackMap.size,
        identifiers: Array.from(this.fallbackMap.keys()),
      };
    }
  }
}

// Pre-configured Redis rate limiters
export const redisApiLimiter = new RedisRateLimiter('rl:api', 15 * 60 * 1000, 100);
export const redisAuthLimiter = new RedisRateLimiter('rl:auth', 15 * 60 * 1000, 5);
export const redisStrictLimiter = new RedisRateLimiter('rl:strict', 60 * 1000, 10);
export const redisImageLimiter = new RedisRateLimiter('rl:image', 15 * 60 * 1000, 20);
export const redisAnalyticsLimiter = new RedisRateLimiter('rl:analytics', 60 * 1000, 60);

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.max(1, retryAfter).toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
      },
    }
  );
}

/**
 * Middleware wrapper for Next.js API routes with Redis rate limiting
 */
export function withRedisRateLimit(
  handler: (request: Request) => Promise<Response>,
  limiter: RedisRateLimiter = redisApiLimiter
) {
  return async (request: Request): Promise<Response> => {
    const identifier = getClientIdentifier(request);
    const result = await limiter.check(identifier);

    if (!result.allowed) {
      return rateLimitResponse(result);
    }

    const response = await handler(request);

    // Add rate limit headers to response
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
