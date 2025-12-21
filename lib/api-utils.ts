/**
 * API utility functions for consistent error handling
 */

import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export interface ApiError {
  error: string;
  details?: unknown;
  code?: string;
}

/**
 * Standard API error response
 */
export function apiError(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiError> {
  const response: ApiError = { error: message };
  if (details) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}

/**
 * Handle and log API errors consistently
 * Logs to Sentry in production, console in development
 */
export function handleApiError(
  error: unknown,
  context: string,
  userMessage: string = 'An error occurred'
): NextResponse<ApiError> {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Log to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: { context },
      extra: { userMessage },
    });
  } else {
    // Log to console in development
    console.error(`[${context}]`, error);
  }

  return apiError(userMessage, 500);
}

/**
 * Common error responses
 *
 * HTTP Status Code Guidelines:
 * - 400 Bad Request: Malformed syntax, invalid parameters
 * - 401 Unauthorized: Missing or invalid authentication
 * - 403 Forbidden: Authenticated but not authorized for this action
 * - 404 Not Found: Resource doesn't exist
 * - 409 Conflict: Resource already exists or state conflict
 * - 422 Unprocessable Entity: Valid syntax but semantic errors (validation failed)
 * - 429 Too Many Requests: Rate limit exceeded
 * - 500 Internal Server Error: Unexpected server error
 */
export const ApiErrors = {
  // Authentication errors (401)
  unauthorized: (message: string = 'Authentication required') =>
    apiError(message, 401),

  // Authorization errors (403)
  forbidden: (message: string = 'Access denied') =>
    apiError(message, 403),

  // Resource errors (404, 409)
  notFound: (resource: string = 'Resource') =>
    apiError(`${resource} not found`, 404),
  conflict: (message: string = 'Resource already exists') =>
    apiError(message, 409),

  // Request errors (400, 422)
  badRequest: (message: string = 'Bad request', details?: unknown) =>
    apiError(message, 400, details),
  validationFailed: (details: unknown) =>
    apiError('Validation failed', 422, details),
  invalidInput: (message: string, details?: unknown) =>
    apiError(message, 422, details),

  // Rate limiting (429)
  rateLimited: (retryAfter: number) =>
    NextResponse.json(
      { error: 'Too many requests', retryAfter },
      {
        status: 429,
        headers: { 'Retry-After': retryAfter.toString() }
      }
    ),

  // Size limits (413)
  payloadTooLarge: (maxSize: number) =>
    apiError(`Request body too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`, 413),

  // Payment required (402)
  insufficientCredits: (required: number, available: number) =>
    apiError(`Insufficient credits. Required: ${required}, Available: ${available}`, 402),
};

/**
 * Request body size limits
 */
export const RequestLimits = {
  JSON: 1 * 1024 * 1024,      // 1MB for JSON
  FORM: 10 * 1024 * 1024,     // 10MB for form data
  IMAGE: 20 * 1024 * 1024,    // 20MB for images
} as const;

/**
 * Validate request body size
 */
export function validateRequestSize(
  request: Request,
  maxSize: number = RequestLimits.JSON
): { valid: true } | { valid: false; response: NextResponse } {
  const contentLength = parseInt(request.headers.get('content-length') || '0');

  if (contentLength > maxSize) {
    return {
      valid: false,
      response: ApiErrors.payloadTooLarge(maxSize),
    };
  }

  return { valid: true };
}

/**
 * Parse JSON body with size validation
 */
export async function parseJSONBody<T>(
  request: Request,
  maxSize: number = RequestLimits.JSON
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  const sizeCheck = validateRequestSize(request, maxSize);
  if (!sizeCheck.valid) {
    return { success: false, response: sizeCheck.response };
  }

  try {
    const data = await request.json() as T;
    return { success: true, data };
  } catch {
    return {
      success: false,
      response: ApiErrors.badRequest('Invalid JSON body'),
    };
  }
}

/**
 * Success response helper
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Pagination helper
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePaginationParams(url: URL): PaginationParams {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const sortBy = url.searchParams.get('sortBy') || undefined;
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  return { page, limit, sortBy, sortOrder };
}

export function paginate<T>(
  items: T[],
  params: PaginationParams
): PaginatedResponse<T> {
  const { page, limit } = params;
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    data: items.slice(start, end),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
