/**
 * Rate limiter for API routes
 * Uses Redis for persistence across instances, with in-memory fallback
 */

import { getRedisClient, isRedisAvailable } from './redis';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;
  private redisPrefix: string;

  constructor(
    redisPrefix: string,
    windowMs: number = 15 * 60 * 1000,
    maxRequests: number = 100
  ) {
    this.redisPrefix = redisPrefix;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Cleanup expired entries every minute (for fallback map)
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Check if request is allowed
   * Tries Redis first, falls back to in-memory
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    // Try Redis if available
    if (isRedisAvailable()) {
      // Note: This is synchronous API for backwards compatibility
      // Redis check happens in the background, we use in-memory as immediate response
      this.checkRedisAsync(identifier).catch(() => {});
    }

    return this.checkInMemory(identifier);
  }

  /**
   * Async version that properly uses Redis
   */
  async checkAsync(identifier: string): Promise<RateLimitResult> {
    if (isRedisAvailable()) {
      try {
        return await this.checkRedis(identifier);
      } catch (error) {
        console.warn('Redis rate limit error, using fallback:', error);
      }
    }

    const result = this.checkInMemory(identifier);
    return { ...result, limit: this.maxRequests };
  }

  /**
   * In-memory rate limiting (fallback)
   */
  private checkInMemory(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No previous requests or window expired
    if (!entry || entry.resetAt < now) {
      const resetAt = now + this.windowMs;
      this.requests.set(identifier, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt,
      };
    }

    // Within window - check limit
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment counter
    entry.count++;
    this.requests.set(identifier, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Redis-based rate limiting using sliding window
   */
  private async checkRedis(identifier: string): Promise<RateLimitResult> {
    const key = `${this.redisPrefix}:${identifier}`;
    const now = Date.now();
    const redis = getRedisClient();

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
        local resetAt = now + window
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
  }

  /**
   * Background Redis sync (fire and forget)
   */
  private async checkRedisAsync(identifier: string): Promise<void> {
    try {
      await this.checkRedis(identifier);
    } catch {
      // Silently fail - in-memory is primary
    }
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);

    if (isRedisAvailable()) {
      const key = `${this.redisPrefix}:${identifier}`;
      getRedisClient().del(key).catch(() => {});
    }
  }

  /**
   * Clean up expired in-memory entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetAt < now) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get stats
   */
  getStats(): { total: number; identifiers: string[] } {
    return {
      total: this.requests.size,
      identifiers: Array.from(this.requests.keys()),
    };
  }
}

// Default limiters for different use cases
export const apiLimiter = new RateLimiter('rl:api', 15 * 60 * 1000, 100); // 100 req per 15 min
export const authLimiter = new RateLimiter('rl:auth', 15 * 60 * 1000, 5);   // 5 req per 15 min
export const strictLimiter = new RateLimiter('rl:strict', 60 * 1000, 10);   // 10 req per minute
export const imageProcessingLimiter = new RateLimiter('rl:image', 15 * 60 * 1000, 20); // 20 per 15 min
export const analyticsLimiter = new RateLimiter('rl:analytics', 60 * 1000, 60); // 60 per minute

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
export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

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
        'X-RateLimit-Reset': new Date(resetAt).toISOString(),
      },
    }
  );
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  limiter: RateLimiter = apiLimiter
) {
  return async (request: Request): Promise<Response> => {
    const identifier = getClientIdentifier(request);
    const { allowed, remaining, resetAt } = limiter.check(identifier);

    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const response = await handler(request);

    // Add rate limit headers to response
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(resetAt).toISOString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

// ============================================
// API Key Rate Limiting (for external API usage)
// ============================================

import { ApiKey } from "@/types/api";

export interface ApiKeyRateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
}

/**
 * Check if API key has exceeded rate limits
 */
export async function checkApiKeyRateLimit(
  apiKey: ApiKey,
  window: "hour" | "day" = "hour"
): Promise<ApiKeyRateLimitResult> {
  const redis = getRedisClient();
  const now = Date.now();
  const windowMs = window === "hour" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const limit =
    window === "hour"
      ? apiKey.rateLimit.requestsPerHour
      : apiKey.rateLimit.requestsPerDay;

  const key = `ratelimit:${apiKey.id}:${window}`;

  try {
    // Use sorted set to store timestamps of requests
    const windowStart = now - windowMs;

    // Remove old entries outside the current window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const count = await redis.zcard(key);

    if (count >= limit) {
      // Rate limit exceeded
      const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
      const resetAt = oldest.length > 0 ? new Date(parseInt(oldest[1]) + windowMs) : new Date(now + windowMs);

      return {
        allowed: false,
        remaining: 0,
        limit,
        resetAt,
      };
    }

    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiry on the key
    await redis.expire(key, Math.ceil(windowMs / 1000));

    return {
      allowed: true,
      remaining: limit - count - 1,
      limit,
      resetAt: new Date(now + windowMs),
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: limit,
      limit,
      resetAt: new Date(now + windowMs),
    };
  }
}

/**
 * Check concurrent jobs limit for API key
 */
export async function checkConcurrentJobsLimit(apiKey: ApiKey): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
}> {
  const redis = getRedisClient();
  const key = `concurrent:${apiKey.id}`;

  try {
    const current = parseInt((await redis.get(key)) || "0");
    const limit = apiKey.rateLimit.concurrentJobs;

    return {
      allowed: current < limit,
      current,
      limit,
    };
  } catch (error) {
    console.error("Concurrent jobs check error:", error);
    return {
      allowed: true,
      current: 0,
      limit: apiKey.rateLimit.concurrentJobs,
    };
  }
}

/**
 * Increment concurrent jobs counter for API key
 */
export async function incrementConcurrentJobs(apiKeyId: string): Promise<void> {
  const redis = getRedisClient();
  const key = `concurrent:${apiKeyId}`;

  try {
    await redis.incr(key);
    // Set expiry in case we miss the decrement
    await redis.expire(key, 600); // 10 minutes
  } catch (error) {
    console.error("Increment concurrent jobs error:", error);
  }
}

/**
 * Decrement concurrent jobs counter for API key
 */
export async function decrementConcurrentJobs(apiKeyId: string): Promise<void> {
  const redis = getRedisClient();
  const key = `concurrent:${apiKeyId}`;

  try {
    const current = await redis.decr(key);
    if (current <= 0) {
      await redis.del(key);
    }
  } catch (error) {
    console.error("Decrement concurrent jobs error:", error);
  }
}
