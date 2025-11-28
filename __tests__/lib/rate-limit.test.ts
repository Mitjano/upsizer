import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  apiLimiter,
  authLimiter,
  strictLimiter,
  imageProcessingLimiter,
  analyticsLimiter,
  getClientIdentifier,
  rateLimitResponse,
} from '@/lib/rate-limit';

describe('rate-limit.ts', () => {
  describe('RateLimiter', () => {
    beforeEach(() => {
      // Reset limiters before each test
      apiLimiter.reset('test-ip');
      authLimiter.reset('test-ip');
      strictLimiter.reset('test-ip');
    });

    describe('apiLimiter (100 req / 15 min)', () => {
      it('should allow initial request', () => {
        const result = apiLimiter.check('api-test-1');
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(99);
        apiLimiter.reset('api-test-1');
      });

      it('should track remaining requests', () => {
        const identifier = 'api-test-2';

        // First request
        let result = apiLimiter.check(identifier);
        expect(result.remaining).toBe(99);

        // Second request
        result = apiLimiter.check(identifier);
        expect(result.remaining).toBe(98);

        // Third request
        result = apiLimiter.check(identifier);
        expect(result.remaining).toBe(97);

        apiLimiter.reset(identifier);
      });

      it('should return resetAt timestamp', () => {
        const before = Date.now();
        const result = apiLimiter.check('api-test-3');
        const after = Date.now();

        // resetAt should be ~15 minutes in the future
        expect(result.resetAt).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
        expect(result.resetAt).toBeLessThanOrEqual(after + 15 * 60 * 1000 + 100);

        apiLimiter.reset('api-test-3');
      });
    });

    describe('authLimiter (5 req / 15 min)', () => {
      it('should allow 5 requests', () => {
        const identifier = 'auth-test-1';

        for (let i = 0; i < 5; i++) {
          const result = authLimiter.check(identifier);
          expect(result.allowed).toBe(true);
        }

        authLimiter.reset(identifier);
      });

      it('should block 6th request', () => {
        const identifier = 'auth-test-2';

        // Make 5 allowed requests
        for (let i = 0; i < 5; i++) {
          authLimiter.check(identifier);
        }

        // 6th should be blocked
        const result = authLimiter.check(identifier);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);

        authLimiter.reset(identifier);
      });

      it('should return proper remaining count', () => {
        const identifier = 'auth-test-3';

        authLimiter.check(identifier); // remaining: 4
        authLimiter.check(identifier); // remaining: 3
        const result = authLimiter.check(identifier); // remaining: 2

        expect(result.remaining).toBe(2);

        authLimiter.reset(identifier);
      });
    });

    describe('strictLimiter (10 req / 1 min)', () => {
      it('should allow up to 10 requests', () => {
        const identifier = 'strict-test-1';

        for (let i = 0; i < 10; i++) {
          const result = strictLimiter.check(identifier);
          expect(result.allowed).toBe(true);
          expect(result.remaining).toBe(9 - i);
        }

        strictLimiter.reset(identifier);
      });

      it('should block after 10 requests', () => {
        const identifier = 'strict-test-2';

        // Exhaust the limit
        for (let i = 0; i < 10; i++) {
          strictLimiter.check(identifier);
        }

        // Should be blocked
        const result = strictLimiter.check(identifier);
        expect(result.allowed).toBe(false);

        strictLimiter.reset(identifier);
      });
    });

    describe('imageProcessingLimiter (20 req / 15 min)', () => {
      it('should have correct limit', () => {
        const identifier = 'image-test-1';
        const result = imageProcessingLimiter.check(identifier);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(19);

        imageProcessingLimiter.reset(identifier);
      });
    });

    describe('analyticsLimiter (60 req / 1 min)', () => {
      it('should have correct limit', () => {
        const identifier = 'analytics-test-1';
        const result = analyticsLimiter.check(identifier);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(59);

        analyticsLimiter.reset(identifier);
      });
    });

    describe('reset', () => {
      it('should reset rate limit for identifier', () => {
        const identifier = 'reset-test-1';

        // Make some requests
        apiLimiter.check(identifier);
        apiLimiter.check(identifier);
        apiLimiter.check(identifier);

        // Reset
        apiLimiter.reset(identifier);

        // Should start fresh
        const result = apiLimiter.check(identifier);
        expect(result.remaining).toBe(99);

        apiLimiter.reset(identifier);
      });
    });

    describe('getStats', () => {
      it('should return current stats', () => {
        const identifier1 = 'stats-test-1';
        const identifier2 = 'stats-test-2';

        apiLimiter.check(identifier1);
        apiLimiter.check(identifier2);

        const stats = apiLimiter.getStats();
        expect(stats.total).toBeGreaterThanOrEqual(2);
        expect(stats.identifiers).toContain(identifier1);
        expect(stats.identifiers).toContain(identifier2);

        apiLimiter.reset(identifier1);
        apiLimiter.reset(identifier2);
      });
    });

    describe('window expiration', () => {
      it('should reset after window expires', () => {
        vi.useFakeTimers();
        const identifier = 'expiration-test-1';

        // Make requests to exhaust limit
        for (let i = 0; i < 5; i++) {
          authLimiter.check(identifier);
        }

        // Should be blocked
        let result = authLimiter.check(identifier);
        expect(result.allowed).toBe(false);

        // Advance time past the window (15 minutes + 1 second)
        vi.advanceTimersByTime(15 * 60 * 1000 + 1000);

        // Should be allowed again
        result = authLimiter.check(identifier);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);

        authLimiter.reset(identifier);
        vi.useRealTimers();
      });
    });
  });

  describe('getClientIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should handle single IP in x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '203.0.113.50',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('203.0.113.50');
    });

    it('should use x-real-ip as fallback', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '10.20.30.40',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('10.20.30.40');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'x-real-ip': '5.6.7.8',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('1.2.3.4');
    });

    it('should fallback to user-agent if no IP headers', () => {
      const request = new Request('https://example.com', {
        headers: {
          'user-agent': 'Mozilla/5.0 Test Browser',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('Mozilla/5.0 Test Browser');
    });

    it('should return "unknown" if no identifying headers', () => {
      const request = new Request('https://example.com');

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('unknown');
    });

    it('should trim whitespace from x-forwarded-for', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '  192.168.1.1  ,  10.0.0.1  ',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });
  });

  describe('rateLimitResponse', () => {
    it('should return 429 status', async () => {
      const resetAt = Date.now() + 60000;
      const response = rateLimitResponse(resetAt);

      expect(response.status).toBe(429);
    });

    it('should include Retry-After header', async () => {
      const resetAt = Date.now() + 60000;
      const response = rateLimitResponse(resetAt);

      const retryAfter = response.headers.get('Retry-After');
      expect(retryAfter).toBeDefined();
      expect(parseInt(retryAfter!)).toBeGreaterThan(0);
      expect(parseInt(retryAfter!)).toBeLessThanOrEqual(60);
    });

    it('should include rate limit headers', async () => {
      const resetAt = Date.now() + 30000;
      const response = rateLimitResponse(resetAt);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include error message in body', async () => {
      const resetAt = Date.now() + 30000;
      const response = rateLimitResponse(resetAt);
      const body = await response.json();

      expect(body.error).toBe('Too many requests');
      expect(body.message).toContain('Rate limit exceeded');
      expect(body.retryAfter).toBeDefined();
      expect(typeof body.retryAfter).toBe('number');
    });

    it('should calculate correct retryAfter value', async () => {
      const now = Date.now();
      const resetAt = now + 45000; // 45 seconds from now
      const response = rateLimitResponse(resetAt);
      const body = await response.json();

      // Should be approximately 45 seconds (with some tolerance for execution time)
      expect(body.retryAfter).toBeGreaterThanOrEqual(44);
      expect(body.retryAfter).toBeLessThanOrEqual(46);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle concurrent requests from different IPs', () => {
      const ips = ['ip1', 'ip2', 'ip3'];

      ips.forEach(ip => {
        const result = strictLimiter.check(ip);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
      });

      // Second request from each IP
      ips.forEach(ip => {
        const result = strictLimiter.check(ip);
        expect(result.remaining).toBe(8);
      });

      // Cleanup
      ips.forEach(ip => strictLimiter.reset(ip));
    });

    it('should isolate limits between different identifiers', () => {
      const id1 = 'isolated-test-1';
      const id2 = 'isolated-test-2';

      // Exhaust limit for id1
      for (let i = 0; i < 5; i++) {
        authLimiter.check(id1);
      }

      // id1 should be blocked
      expect(authLimiter.check(id1).allowed).toBe(false);

      // id2 should still be allowed
      expect(authLimiter.check(id2).allowed).toBe(true);
      expect(authLimiter.check(id2).remaining).toBe(3);

      // Cleanup
      authLimiter.reset(id1);
      authLimiter.reset(id2);
    });
  });
});
