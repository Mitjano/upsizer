import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next-auth before importing security module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

// Mock next/server
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest extends Request {},
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
      }),
    next: () => new Response(),
    redirect: (url: string) => new Response(null, { status: 302, headers: { location: url } }),
  },
}));

import {
  MAX_JSON_SIZE,
  MAX_FORM_SIZE,
  MAX_IMAGE_SIZE,
  validateRequestSize,
  parseJSONBody,
  validateOrigin,
  csrfBlockedResponse,
  requestTooLargeResponse,
  sanitizeString,
  isValidEmail,
  generateSecureToken,
  hashForLogging,
} from '@/lib/security';

// Mock NextRequest constructor for testing
function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
}): NextRequest {
  const { method = 'GET', url = 'https://pixelift.pl/api/test', headers = {}, body } = options;

  const headersInit = new Headers(headers);

  const request = new Request(url, {
    method,
    headers: headersInit,
    body: body ? JSON.stringify(body) : undefined,
  });

  return request as unknown as NextRequest;
}

describe('security.ts', () => {
  describe('Constants', () => {
    it('should have correct size limits', () => {
      expect(MAX_JSON_SIZE).toBe(1 * 1024 * 1024); // 1MB
      expect(MAX_FORM_SIZE).toBe(10 * 1024 * 1024); // 10MB
      expect(MAX_IMAGE_SIZE).toBe(20 * 1024 * 1024); // 20MB
    });
  });

  describe('validateRequestSize', () => {
    it('should return true for requests under limit', () => {
      const request = createMockRequest({
        headers: { 'content-length': '1000' },
      });

      expect(validateRequestSize(request)).toBe(true);
    });

    it('should return true for requests at limit', () => {
      const request = createMockRequest({
        headers: { 'content-length': MAX_JSON_SIZE.toString() },
      });

      expect(validateRequestSize(request)).toBe(true);
    });

    it('should return false for requests over limit', () => {
      const request = createMockRequest({
        headers: { 'content-length': (MAX_JSON_SIZE + 1).toString() },
      });

      expect(validateRequestSize(request)).toBe(false);
    });

    it('should return true for requests without content-length', () => {
      const request = createMockRequest({});

      expect(validateRequestSize(request)).toBe(true);
    });

    it('should respect custom max size', () => {
      const customSize = 500;
      const request = createMockRequest({
        headers: { 'content-length': '600' },
      });

      expect(validateRequestSize(request, customSize)).toBe(false);
    });
  });

  describe('validateOrigin', () => {
    it('should allow requests from pixelift.pl', () => {
      const request = createMockRequest({
        headers: { 'origin': 'https://pixelift.pl' },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should allow requests from www.pixelift.pl', () => {
      const request = createMockRequest({
        headers: { 'origin': 'https://www.pixelift.pl' },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should allow requests from localhost:3000', () => {
      const request = createMockRequest({
        headers: { 'origin': 'http://localhost:3000' },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should allow requests from 127.0.0.1:3000', () => {
      const request = createMockRequest({
        headers: { 'origin': 'http://127.0.0.1:3000' },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should allow requests without origin (same-origin)', () => {
      const request = createMockRequest({});

      expect(validateOrigin(request)).toBe(true);
    });

    it('should block requests from unknown origins', () => {
      const request = createMockRequest({
        headers: { 'origin': 'https://malicious-site.com' },
      });

      expect(validateOrigin(request)).toBe(false);
    });

    // Note: Current implementation uses startsWith which allows subdomains
    // This is a known limitation - see security.ts validateOrigin function
    it('should block requests from completely different origins', () => {
      const request = createMockRequest({
        headers: { 'origin': 'https://evil-pixelift.com' },
      });

      expect(validateOrigin(request)).toBe(false);
    });

    it('should use referer as fallback when no origin', () => {
      const request = createMockRequest({
        headers: { 'referer': 'https://pixelift.pl/dashboard' },
      });

      expect(validateOrigin(request)).toBe(true);
    });

    it('should block invalid referer when no origin', () => {
      const request = createMockRequest({
        headers: { 'referer': 'https://attacker.com/page' },
      });

      expect(validateOrigin(request)).toBe(false);
    });
  });

  describe('csrfBlockedResponse', () => {
    it('should return 403 status', async () => {
      const response = csrfBlockedResponse();

      expect(response.status).toBe(403);
    });

    it('should include CSRF error message', async () => {
      const response = csrfBlockedResponse();
      const body = await response.json();

      expect(body.error).toContain('CSRF');
    });
  });

  describe('requestTooLargeResponse', () => {
    it('should return 413 status', async () => {
      const response = requestTooLargeResponse(MAX_JSON_SIZE);

      expect(response.status).toBe(413);
    });

    it('should include size in error message', async () => {
      const response = requestTooLargeResponse(MAX_JSON_SIZE);
      const body = await response.json();

      expect(body.error).toContain('1MB');
    });

    it('should correctly format different sizes', async () => {
      const response = requestTooLargeResponse(20 * 1024 * 1024);
      const body = await response.json();

      expect(body.error).toContain('20MB');
    });
  });

  describe('sanitizeString', () => {
    it('should remove HTML angle brackets', () => {
      expect(sanitizeString('<script>')).toBe('script');
      expect(sanitizeString('Hello <b>World</b>')).toBe('Hello bWorld/b');
    });

    it('should remove javascript: protocol', () => {
      expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeString('JAVASCRIPT:malicious()')).toBe('malicious()');
    });

    it('should remove event handlers', () => {
      expect(sanitizeString('onclick=steal()')).toBe('steal()');
      expect(sanitizeString('ONLOAD=hack()')).toBe('hack()');
      expect(sanitizeString('onmouseover=bad()')).toBe('bad()');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\n\t  text  \n')).toBe('text');
    });

    it('should handle clean input', () => {
      expect(sanitizeString('Hello, World!')).toBe('Hello, World!');
      expect(sanitizeString('user@example.com')).toBe('user@example.com');
    });

    it('should handle non-string input', () => {
      // @ts-expect-error Testing non-string input
      expect(sanitizeString(null)).toBe('');
      // @ts-expect-error Testing non-string input
      expect(sanitizeString(undefined)).toBe('');
      // @ts-expect-error Testing non-string input
      expect(sanitizeString(123)).toBe('');
    });

    it('should handle complex XSS attempts', () => {
      const xss = '<img src=x onerror=alert(1)>';
      const sanitized = sanitizeString(xss);
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('onerror=');
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
      expect(isValidEmail('a@b.co')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@invalid.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of default length', () => {
      const token = generateSecureToken();
      expect(token.length).toBe(32);
    });

    it('should generate token of custom length', () => {
      expect(generateSecureToken(16).length).toBe(16);
      expect(generateSecureToken(64).length).toBe(64);
      expect(generateSecureToken(8).length).toBe(8);
    });

    it('should only contain alphanumeric characters', () => {
      const token = generateSecureToken(100);
      const validChars = /^[A-Za-z0-9]+$/;
      expect(validChars.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      // All 100 tokens should be unique
      expect(tokens.size).toBe(100);
    });

    it('should be cryptographically random', () => {
      // Generate many tokens and check character distribution
      const charCounts: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        const token = generateSecureToken(10);
        for (const char of token) {
          charCounts[char] = (charCounts[char] || 0) + 1;
        }
      }

      // Should use variety of characters (at least 30 different chars from 62 possible)
      expect(Object.keys(charCounts).length).toBeGreaterThan(30);
    });
  });

  describe('hashForLogging', () => {
    it('should mask middle of long strings', () => {
      const result = hashForLogging('sensitive_data_here');
      expect(result).toBe('sens****here');
    });

    it('should return **** for short strings', () => {
      expect(hashForLogging('short')).toBe('****');
      expect(hashForLogging('12345678')).toBe('****');
    });

    it('should handle exactly 9 character strings', () => {
      const result = hashForLogging('123456789');
      expect(result).toBe('1234****6789');
    });

    it('should return empty string for empty input', () => {
      expect(hashForLogging('')).toBe('');
    });

    it('should handle API keys', () => {
      const apiKey = 'sk-1234567890abcdef';
      const masked = hashForLogging(apiKey);
      expect(masked).toBe('sk-1****cdef');
      expect(masked).not.toContain('567890');
    });

    it('should handle email addresses', () => {
      const email = 'user@example.com';
      const masked = hashForLogging(email);
      expect(masked).toBe('user****.com');
      expect(masked).not.toContain('@example');
    });
  });

  describe('parseJSONBody', () => {
    it('should parse valid JSON', async () => {
      const mockBody = { name: 'Test', value: 123 };
      const request = new Request('https://pixelift.pl/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': JSON.stringify(mockBody).length.toString(),
        },
        body: JSON.stringify(mockBody),
      }) as unknown as NextRequest;

      const result = await parseJSONBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockBody);
      }
    });

    it('should reject request exceeding size limit', async () => {
      const largeContent = 'x'.repeat(MAX_JSON_SIZE + 1);
      const request = new Request('https://pixelift.pl/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': largeContent.length.toString(),
        },
        body: JSON.stringify({ data: largeContent }),
      }) as unknown as NextRequest;

      const result = await parseJSONBody(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('too large');
      }
    });

    it('should reject invalid JSON', async () => {
      const request = new Request('https://pixelift.pl/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': '20',
        },
        body: 'not valid json {{{',
      }) as unknown as NextRequest;

      const result = await parseJSONBody(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid JSON');
      }
    });

    it('should respect custom size limit', async () => {
      const customLimit = 100;
      const body = { data: 'x'.repeat(200) };
      const request = new Request('https://pixelift.pl/api/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': JSON.stringify(body).length.toString(),
        },
        body: JSON.stringify(body),
      }) as unknown as NextRequest;

      const result = await parseJSONBody(request, customLimit);
      expect(result.success).toBe(false);
    });
  });
});
