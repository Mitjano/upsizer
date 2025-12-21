import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Sentry before importing api-utils
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
      }),
  },
}));

import {
  apiError,
  handleApiError,
  ApiErrors,
  RequestLimits,
  validateRequestSize,
  parseJSONBody,
  apiSuccess,
  parsePaginationParams,
  paginate,
} from '@/lib/api-utils';
import * as Sentry from '@sentry/nextjs';

describe('api-utils.ts', () => {
  describe('RequestLimits', () => {
    it('should have correct size limits', () => {
      expect(RequestLimits.JSON).toBe(1 * 1024 * 1024); // 1MB
      expect(RequestLimits.FORM).toBe(10 * 1024 * 1024); // 10MB
      expect(RequestLimits.IMAGE).toBe(20 * 1024 * 1024); // 20MB
    });
  });

  describe('apiError', () => {
    it('should return error response with default 500 status', async () => {
      const response = apiError('Something went wrong');
      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body.error).toBe('Something went wrong');
    });

    it('should return error with custom status', async () => {
      const response = apiError('Not found', 404);
      expect(response.status).toBe(404);
    });

    it('should include details when provided', async () => {
      const details = { field: 'email', reason: 'invalid format' };
      const response = apiError('Validation error', 400, details);

      const body = await response.json();
      expect(body.error).toBe('Validation error');
      expect(body.details).toEqual(details);
    });

    it('should not include details when not provided', async () => {
      const response = apiError('Error message');
      const body = await response.json();

      expect(body.error).toBe('Error message');
      expect(body.details).toBeUndefined();
    });
  });

  describe('handleApiError', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return 500 status', async () => {
      const response = handleApiError(new Error('Test'), 'context');
      expect(response.status).toBe(500);
    });

    it('should return user-friendly message', async () => {
      const response = handleApiError(new Error('Internal error'), 'context', 'Something went wrong');
      const body = await response.json();
      expect(body.error).toBe('Something went wrong');
    });

    it('should use default message when not provided', async () => {
      const response = handleApiError(new Error('Test'), 'context');
      const body = await response.json();
      expect(body.error).toBe('An error occurred');
    });

    it('should handle non-Error objects', async () => {
      const response = handleApiError('string error', 'context');
      expect(response.status).toBe(500);
    });

    it('should handle error with message', async () => {
      const error = new Error('Database connection failed');
      const response = handleApiError(error, 'db-connect', 'Connection issue');
      const body = await response.json();
      expect(body.error).toBe('Connection issue');
    });
  });

  describe('ApiErrors', () => {
    it('unauthorized should return 401', async () => {
      const response = ApiErrors.unauthorized();
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Authentication required');
    });

    it('forbidden should return 403', async () => {
      const response = ApiErrors.forbidden();
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body.error).toBe('Access denied');
    });

    it('notFound should return 404 with default message', async () => {
      const response = ApiErrors.notFound();
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body.error).toBe('Resource not found');
    });

    it('notFound should return 404 with custom resource', async () => {
      const response = ApiErrors.notFound('User');

      const body = await response.json();
      expect(body.error).toBe('User not found');
    });

    it('badRequest should return 400', async () => {
      const response = ApiErrors.badRequest('Invalid input');
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe('Invalid input');
    });

    it('badRequest should include details', async () => {
      const details = { field: 'email' };
      const response = ApiErrors.badRequest('Invalid', details);

      const body = await response.json();
      expect(body.details).toEqual(details);
    });

    it('validationFailed should return 422 with details', async () => {
      const details = { email: ['required'], name: ['too short'] };
      const response = ApiErrors.validationFailed(details);
      expect(response.status).toBe(422);

      const body = await response.json();
      expect(body.error).toBe('Validation failed');
      expect(body.details).toEqual(details);
    });

    it('rateLimited should return 429 with Retry-After header', async () => {
      const response = ApiErrors.rateLimited(60);
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');

      const body = await response.json();
      expect(body.error).toBe('Too many requests');
      expect(body.retryAfter).toBe(60);
    });

    it('payloadTooLarge should return 413', async () => {
      const response = ApiErrors.payloadTooLarge(10 * 1024 * 1024);
      expect(response.status).toBe(413);

      const body = await response.json();
      expect(body.error).toContain('10MB');
    });
  });

  describe('validateRequestSize', () => {
    it('should return valid true for requests under limit', () => {
      const request = new Request('https://test.com', {
        headers: { 'content-length': '1000' },
      });

      const result = validateRequestSize(request);
      expect(result.valid).toBe(true);
    });

    it('should return valid false for requests over limit', () => {
      const request = new Request('https://test.com', {
        headers: { 'content-length': (RequestLimits.JSON + 1).toString() },
      });

      const result = validateRequestSize(request);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.response.status).toBe(413);
      }
    });

    it('should use custom max size', () => {
      const customSize = 500;
      const request = new Request('https://test.com', {
        headers: { 'content-length': '600' },
      });

      const result = validateRequestSize(request, customSize);
      expect(result.valid).toBe(false);
    });
  });

  describe('parseJSONBody', () => {
    it('should parse valid JSON', async () => {
      const body = { name: 'Test', value: 42 };
      const request = new Request('https://test.com', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': JSON.stringify(body).length.toString(),
        },
        body: JSON.stringify(body),
      });

      const result = await parseJSONBody(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(body);
      }
    });

    it('should reject oversized requests', async () => {
      const request = new Request('https://test.com', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': (RequestLimits.JSON + 1).toString(),
        },
      });

      const result = await parseJSONBody(request);
      expect(result.success).toBe(false);
    });

    it('should reject invalid JSON', async () => {
      const request = new Request('https://test.com', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': '20',
        },
        body: 'not valid json',
      });

      const result = await parseJSONBody(request);
      expect(result.success).toBe(false);
      if (!result.success) {
        const body = await result.response.json();
        expect(body.error).toContain('Invalid JSON');
      }
    });
  });

  describe('apiSuccess', () => {
    it('should return data with default 200 status', async () => {
      const data = { id: 1, name: 'Test' };
      const response = apiSuccess(data);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual(data);
    });

    it('should return data with custom status', async () => {
      const response = apiSuccess({ created: true }, 201);
      expect(response.status).toBe(201);
    });
  });

  describe('parsePaginationParams', () => {
    it('should parse default values', () => {
      const url = new URL('https://test.com/api/users');
      const params = parsePaginationParams(url);

      expect(params.page).toBe(1);
      expect(params.limit).toBe(20);
      expect(params.sortOrder).toBe('desc');
    });

    it('should parse custom page and limit', () => {
      const url = new URL('https://test.com/api/users?page=3&limit=50');
      const params = parsePaginationParams(url);

      expect(params.page).toBe(3);
      expect(params.limit).toBe(50);
    });

    it('should clamp limit to max 100', () => {
      const url = new URL('https://test.com/api/users?limit=500');
      const params = parsePaginationParams(url);

      expect(params.limit).toBe(100);
    });

    it('should clamp limit to min 1', () => {
      const url = new URL('https://test.com/api/users?limit=-5');
      const params = parsePaginationParams(url);

      expect(params.limit).toBe(1);
    });

    it('should clamp page to min 1', () => {
      const url = new URL('https://test.com/api/users?page=-2');
      const params = parsePaginationParams(url);

      expect(params.page).toBe(1);
    });

    it('should parse sortBy and sortOrder', () => {
      const url = new URL('https://test.com/api/users?sortBy=createdAt&sortOrder=asc');
      const params = parsePaginationParams(url);

      expect(params.sortBy).toBe('createdAt');
      expect(params.sortOrder).toBe('asc');
    });
  });

  describe('paginate', () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

    it('should return first page correctly', () => {
      const result = paginate(items, { page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data.length).toBe(10);
      expect(result.data[0].id).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.totalPages).toBe(10);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should return middle page correctly', () => {
      const result = paginate(items, { page: 5, limit: 10, sortOrder: 'desc' });

      expect(result.data.length).toBe(10);
      expect(result.data[0].id).toBe(41);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should return last page correctly', () => {
      const result = paginate(items, { page: 10, limit: 10, sortOrder: 'desc' });

      expect(result.data.length).toBe(10);
      expect(result.data[0].id).toBe(91);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should handle partial last page', () => {
      const smallItems = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
      const result = paginate(smallItems, { page: 3, limit: 10, sortOrder: 'desc' });

      expect(result.data.length).toBe(5);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should handle empty array', () => {
      const result = paginate([], { page: 1, limit: 10, sortOrder: 'desc' });

      expect(result.data.length).toBe(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should handle page beyond total pages', () => {
      const result = paginate(items, { page: 15, limit: 10, sortOrder: 'desc' });

      expect(result.data.length).toBe(0);
      expect(result.pagination.page).toBe(15);
    });
  });
});
