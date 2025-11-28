/**
 * Simple in-memory rate limiter for API routes
 * Tracks requests per IP address with sliding window
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Check if request is allowed
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
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
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clean up expired entries
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
export const apiLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 req per 15 min
export const authLimiter = new RateLimiter(15 * 60 * 1000, 5);   // 5 req per 15 min (login attempts)
export const strictLimiter = new RateLimiter(60 * 1000, 10);     // 10 req per minute

// Heavy operations limiter (image processing) - 20 per 15 min per IP
export const imageProcessingLimiter = new RateLimiter(15 * 60 * 1000, 20);

// Analytics tracking - 60 per minute (page views etc)
export const analyticsLimiter = new RateLimiter(60 * 1000, 60);

/**
 * Get client identifier from request
 * Uses IP address or fallback to a header
 */
export function getClientIdentifier(request: Request): string {
  // Try to get real IP from headers (behind proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection info (not available in Edge runtime)
  // Use a session-based identifier if IP not available
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
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '100',
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

    // Add rate limit headers to response
    const response = await handler(request);

    // Clone response to add headers
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', limiter['maxRequests'].toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(resetAt).toISOString());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
