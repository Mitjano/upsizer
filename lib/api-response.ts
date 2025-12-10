import { NextResponse } from 'next/server';

/**
 * Standardized API Response Types
 *
 * All API endpoints should use these helpers to ensure consistent response format.
 */

// Standard API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Common error codes
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',

  // Business logic
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  status = 200,
  meta?: Partial<ApiResponse['meta']>
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return NextResponse.json(response, { status });
}

/**
 * Create an error response
 */
export function errorResponse(
  code: ErrorCode | string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiResponse<never>> {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return NextResponse.json(response, { status });
}

/**
 * Create a paginated success response
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
): NextResponse<ApiResponse<T[]>> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return successResponse(data, 200, {
    pagination: {
      ...pagination,
      totalPages,
    },
  });
}

// Pre-defined error responses for common cases
export const ApiErrors = {
  // 401 - Unauthorized
  unauthorized: (message = 'Authentication required') =>
    errorResponse(ErrorCodes.UNAUTHORIZED, message, 401),

  invalidToken: (message = 'Invalid or expired token') =>
    errorResponse(ErrorCodes.INVALID_TOKEN, message, 401),

  sessionExpired: () =>
    errorResponse(ErrorCodes.SESSION_EXPIRED, 'Session has expired. Please log in again.', 401),

  // 403 - Forbidden
  forbidden: (message = 'Access denied') =>
    errorResponse(ErrorCodes.FORBIDDEN, message, 403),

  adminOnly: () =>
    errorResponse(ErrorCodes.FORBIDDEN, 'Admin access required', 403),

  // 404 - Not Found
  notFound: (resource = 'Resource') =>
    errorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, 404),

  // 409 - Conflict
  alreadyExists: (resource = 'Resource') =>
    errorResponse(ErrorCodes.ALREADY_EXISTS, `${resource} already exists`, 409),

  // 422 - Validation Error
  validationError: (details: unknown) =>
    errorResponse(ErrorCodes.VALIDATION_ERROR, 'Validation failed', 422, details),

  invalidInput: (message: string) =>
    errorResponse(ErrorCodes.INVALID_INPUT, message, 422),

  missingField: (field: string) =>
    errorResponse(ErrorCodes.MISSING_FIELD, `Missing required field: ${field}`, 422),

  // 429 - Rate Limited
  rateLimited: (resetAt?: number) =>
    errorResponse(
      ErrorCodes.RATE_LIMITED,
      'Too many requests. Please try again later.',
      429,
      resetAt ? { resetAt: new Date(resetAt).toISOString() } : undefined
    ),

  quotaExceeded: () =>
    errorResponse(ErrorCodes.QUOTA_EXCEEDED, 'API quota exceeded', 429),

  // 500 - Server Errors
  internalError: (message = 'Internal server error') =>
    errorResponse(ErrorCodes.INTERNAL_ERROR, message, 500),

  serviceUnavailable: (service = 'Service') =>
    errorResponse(ErrorCodes.SERVICE_UNAVAILABLE, `${service} is temporarily unavailable`, 503),

  externalApiError: (service: string, details?: unknown) =>
    errorResponse(ErrorCodes.EXTERNAL_API_ERROR, `External API error: ${service}`, 502, details),

  // Business logic errors
  insufficientCredits: (required?: number, available?: number) =>
    errorResponse(
      ErrorCodes.INSUFFICIENT_CREDITS,
      'Insufficient credits for this operation',
      402,
      required && available ? { required, available } : undefined
    ),

  fileTooLarge: (maxSize: string) =>
    errorResponse(ErrorCodes.FILE_TOO_LARGE, `File exceeds maximum size of ${maxSize}`, 413),

  invalidFileType: (allowedTypes: string[]) =>
    errorResponse(
      ErrorCodes.INVALID_FILE_TYPE,
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      415,
      { allowedTypes }
    ),

  processingFailed: (reason?: string) =>
    errorResponse(
      ErrorCodes.PROCESSING_FAILED,
      reason || 'Image processing failed',
      500
    ),
};

/**
 * Wrapper for async route handlers with error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<ApiResponse<T>>>
): Promise<NextResponse<ApiResponse<T>>> {
  return handler().catch((error: Error) => {
    console.error('API Error:', error);
    return ApiErrors.internalError(
      process.env.NODE_ENV === 'development' ? error.message : undefined
    ) as NextResponse<ApiResponse<T>>;
  });
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse(response: ApiResponse): response is ApiResponse<never> & { error: NonNullable<ApiResponse['error']> } {
  return !response.success && !!response.error;
}

/**
 * Extract data from successful response or throw
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined) {
    throw new Error(response.error?.message || 'Unknown error');
  }
  return response.data;
}
