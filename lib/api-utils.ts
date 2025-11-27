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
 */
export const ApiErrors = {
  unauthorized: () => apiError('Unauthorized', 401),
  forbidden: () => apiError('Forbidden', 403),
  notFound: (resource: string = 'Resource') => apiError(`${resource} not found`, 404),
  badRequest: (message: string = 'Bad request', details?: unknown) =>
    apiError(message, 400, details),
  validationFailed: (details: unknown) =>
    apiError('Validation failed', 400, details),
  rateLimited: (retryAfter: number) =>
    NextResponse.json(
      { error: 'Too many requests', retryAfter },
      {
        status: 429,
        headers: { 'Retry-After': retryAfter.toString() }
      }
    ),
};

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
