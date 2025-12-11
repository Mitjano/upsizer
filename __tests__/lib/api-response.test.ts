import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  ApiErrors,
  ErrorCodes,
  isErrorResponse,
  unwrapResponse,
  withErrorHandler,
  type ApiResponse,
} from '@/lib/api-response';

describe('api-response.ts', () => {
  describe('successResponse', () => {
    it('should create a success response with data', async () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.meta).toBeDefined();
      expect(body.meta.timestamp).toBeDefined();
    });

    it('should allow custom status code', async () => {
      const response = successResponse({ created: true }, 201);
      expect(response.status).toBe(201);
    });

    it('should include custom meta data', async () => {
      const response = successResponse({ id: 1 }, 200, { requestId: 'req-123' });
      const body = await response.json();

      expect(body.meta.requestId).toBe('req-123');
    });

    it('should handle null data', async () => {
      const response = successResponse(null);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toBeNull();
    });

    it('should handle array data', async () => {
      const data = [1, 2, 3];
      const response = successResponse(data);
      const body = await response.json();

      expect(body.data).toEqual([1, 2, 3]);
    });
  });

  describe('errorResponse', () => {
    it('should create an error response', async () => {
      const response = errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid input');
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Invalid input');
    });

    it('should include error details when provided', async () => {
      const details = { field: 'email', reason: 'Invalid format' };
      const response = errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', 422, details);
      const body = await response.json();

      expect(body.error.details).toEqual(details);
    });

    it('should not include details when undefined', async () => {
      const response = errorResponse(ErrorCodes.NOT_FOUND, 'Not found', 404);
      const body = await response.json();

      expect(body.error.details).toBeUndefined();
    });

    it('should allow custom error codes', async () => {
      const response = errorResponse('CUSTOM_ERROR', 'Custom error message', 400);
      const body = await response.json();

      expect(body.error.code).toBe('CUSTOM_ERROR');
    });
  });

  describe('paginatedResponse', () => {
    it('should create paginated response', async () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = paginatedResponse(data, { page: 1, limit: 10, total: 25 });
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.meta.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('should calculate totalPages correctly', async () => {
      const response = paginatedResponse([], { page: 1, limit: 10, total: 100 });
      const body = await response.json();

      expect(body.meta.pagination.totalPages).toBe(10);
    });

    it('should handle zero total', async () => {
      const response = paginatedResponse([], { page: 1, limit: 10, total: 0 });
      const body = await response.json();

      expect(body.meta.pagination.totalPages).toBe(0);
    });

    it('should handle partial last page', async () => {
      const response = paginatedResponse([], { page: 1, limit: 10, total: 15 });
      const body = await response.json();

      expect(body.meta.pagination.totalPages).toBe(2);
    });
  });

  describe('ApiErrors', () => {
    describe('unauthorized', () => {
      it('should return 401 with default message', async () => {
        const response = ApiErrors.unauthorized();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error.code).toBe('UNAUTHORIZED');
        expect(body.error.message).toBe('Authentication required');
      });

      it('should allow custom message', async () => {
        const response = ApiErrors.unauthorized('Please login first');
        const body = await response.json();

        expect(body.error.message).toBe('Please login first');
      });
    });

    describe('invalidToken', () => {
      it('should return 401', async () => {
        const response = ApiErrors.invalidToken();
        expect(response.status).toBe(401);
      });
    });

    describe('sessionExpired', () => {
      it('should return 401 with session expired message', async () => {
        const response = ApiErrors.sessionExpired();
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.error.code).toBe('SESSION_EXPIRED');
      });
    });

    describe('forbidden', () => {
      it('should return 403', async () => {
        const response = ApiErrors.forbidden();
        expect(response.status).toBe(403);
      });
    });

    describe('adminOnly', () => {
      it('should return 403 with admin message', async () => {
        const response = ApiErrors.adminOnly();
        const body = await response.json();

        expect(response.status).toBe(403);
        expect(body.error.message).toBe('Admin access required');
      });
    });

    describe('notFound', () => {
      it('should return 404 with resource name', async () => {
        const response = ApiErrors.notFound('User');
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.error.message).toBe('User not found');
      });

      it('should use default resource name', async () => {
        const response = ApiErrors.notFound();
        const body = await response.json();

        expect(body.error.message).toBe('Resource not found');
      });
    });

    describe('alreadyExists', () => {
      it('should return 409', async () => {
        const response = ApiErrors.alreadyExists('Email');
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(body.error.message).toBe('Email already exists');
      });
    });

    describe('validationError', () => {
      it('should return 422 with details', async () => {
        const details = { email: 'Invalid email format' };
        const response = ApiErrors.validationError(details);
        const body = await response.json();

        expect(response.status).toBe(422);
        expect(body.error.details).toEqual(details);
      });
    });

    describe('invalidInput', () => {
      it('should return 422 with message', async () => {
        const response = ApiErrors.invalidInput('Email must be valid');
        const body = await response.json();

        expect(response.status).toBe(422);
        expect(body.error.message).toBe('Email must be valid');
      });
    });

    describe('missingField', () => {
      it('should return 422 with field name', async () => {
        const response = ApiErrors.missingField('email');
        const body = await response.json();

        expect(response.status).toBe(422);
        expect(body.error.message).toBe('Missing required field: email');
      });
    });

    describe('rateLimited', () => {
      it('should return 429', async () => {
        const response = ApiErrors.rateLimited();
        expect(response.status).toBe(429);
      });

      it('should include resetAt when provided', async () => {
        const resetAt = Date.now() + 60000;
        const response = ApiErrors.rateLimited(resetAt);
        const body = await response.json();

        expect(body.error.details).toBeDefined();
        expect(body.error.details.resetAt).toBeDefined();
      });
    });

    describe('quotaExceeded', () => {
      it('should return 429', async () => {
        const response = ApiErrors.quotaExceeded();
        const body = await response.json();

        expect(response.status).toBe(429);
        expect(body.error.code).toBe('QUOTA_EXCEEDED');
      });
    });

    describe('internalError', () => {
      it('should return 500', async () => {
        const response = ApiErrors.internalError();
        expect(response.status).toBe(500);
      });

      it('should allow custom message', async () => {
        const response = ApiErrors.internalError('Database connection failed');
        const body = await response.json();

        expect(body.error.message).toBe('Database connection failed');
      });
    });

    describe('serviceUnavailable', () => {
      it('should return 503', async () => {
        const response = ApiErrors.serviceUnavailable('Redis');
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body.error.message).toBe('Redis is temporarily unavailable');
      });
    });

    describe('externalApiError', () => {
      it('should return 502', async () => {
        const response = ApiErrors.externalApiError('Replicate');
        expect(response.status).toBe(502);
      });

      it('should include details when provided', async () => {
        const details = { statusCode: 503 };
        const response = ApiErrors.externalApiError('Replicate', details);
        const body = await response.json();

        expect(body.error.details).toEqual(details);
      });
    });

    describe('insufficientCredits', () => {
      it('should return 402', async () => {
        const response = ApiErrors.insufficientCredits();
        expect(response.status).toBe(402);
      });

      it('should include credit info when provided', async () => {
        const response = ApiErrors.insufficientCredits(10, 5);
        const body = await response.json();

        expect(body.error.details).toEqual({ required: 10, available: 5 });
      });
    });

    describe('fileTooLarge', () => {
      it('should return 413', async () => {
        const response = ApiErrors.fileTooLarge('10MB');
        const body = await response.json();

        expect(response.status).toBe(413);
        expect(body.error.message).toBe('File exceeds maximum size of 10MB');
      });
    });

    describe('invalidFileType', () => {
      it('should return 415 with allowed types', async () => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        const response = ApiErrors.invalidFileType(allowedTypes);
        const body = await response.json();

        expect(response.status).toBe(415);
        expect(body.error.details).toEqual({ allowedTypes });
      });
    });

    describe('processingFailed', () => {
      it('should return 500', async () => {
        const response = ApiErrors.processingFailed();
        expect(response.status).toBe(500);
      });

      it('should include reason when provided', async () => {
        const response = ApiErrors.processingFailed('Memory limit exceeded');
        const body = await response.json();

        expect(body.error.message).toBe('Memory limit exceeded');
      });
    });
  });

  describe('isErrorResponse', () => {
    it('should return true for error response', () => {
      const response: ApiResponse = {
        success: false,
        error: { code: 'ERROR', message: 'Test error' },
      };
      expect(isErrorResponse(response)).toBe(true);
    });

    it('should return false for success response', () => {
      const response: ApiResponse = {
        success: true,
        data: { id: 1 },
      };
      expect(isErrorResponse(response)).toBe(false);
    });

    it('should return false if error is missing', () => {
      const response: ApiResponse = {
        success: false,
      };
      expect(isErrorResponse(response)).toBe(false);
    });
  });

  describe('unwrapResponse', () => {
    it('should return data from success response', () => {
      const response: ApiResponse<{ id: number }> = {
        success: true,
        data: { id: 1 },
      };
      expect(unwrapResponse(response)).toEqual({ id: 1 });
    });

    it('should throw on error response', () => {
      const response: ApiResponse = {
        success: false,
        error: { code: 'ERROR', message: 'Something went wrong' },
      };
      expect(() => unwrapResponse(response)).toThrow('Something went wrong');
    });

    it('should throw with default message if no error message', () => {
      const response: ApiResponse = {
        success: false,
      };
      expect(() => unwrapResponse(response)).toThrow('Unknown error');
    });

    it('should throw if data is undefined even on success', () => {
      const response: ApiResponse = {
        success: true,
      };
      expect(() => unwrapResponse(response)).toThrow('Unknown error');
    });
  });

  describe('withErrorHandler', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should return handler result on success', async () => {
      const handler = async () => successResponse({ id: 1 });
      const response = await withErrorHandler(handler);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toEqual({ id: 1 });
    });

    it('should catch errors and return internal error', async () => {
      const handler = async () => {
        throw new Error('Test error');
      };
      const response = await withErrorHandler(handler);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should log errors to console', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      const handler = async () => {
        throw new Error('Test error');
      };

      await withErrorHandler(handler);

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCodes.RATE_LIMITED).toBe('RATE_LIMITED');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCodes.INSUFFICIENT_CREDITS).toBe('INSUFFICIENT_CREDITS');
    });
  });
});
