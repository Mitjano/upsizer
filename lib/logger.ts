/**
 * Structured logging with pino
 * Provides consistent, searchable logs with request tracing
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

// Create base pino logger
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  base: {
    env: process.env.NODE_ENV,
    service: 'pixelift',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a child logger with request context
 */
export function createRequestLogger(requestId: string, context?: Record<string, unknown>) {
  return pinoLogger.child({
    requestId,
    ...context,
  });
}

/**
 * Logger class wrapping pino for backwards compatibility
 */
class Logger {
  debug(message: string, data?: any) {
    pinoLogger.debug(data || {}, message);
  }

  info(message: string, data?: any) {
    pinoLogger.info(data || {}, message);
  }

  warn(message: string, data?: any) {
    pinoLogger.warn(data || {}, message);
  }

  error(message: string, error?: any) {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : error;
    pinoLogger.error(errorData || {}, message);
  }

  // API-specific logging
  apiRequest(method: string, path: string, userId?: string, durationMs?: number) {
    pinoLogger.info({ type: 'api_request', method, path, userId, durationMs }, `${method} ${path}`);
  }

  apiError(method: string, path: string, error: any, userId?: string) {
    pinoLogger.error({ type: 'api_error', method, path, error, userId }, `${method} ${path} failed`);
  }

  // Performance logging
  performance(operation: string, duration: number) {
    pinoLogger.info({ type: 'performance', operation, durationMs: duration }, `${operation} took ${duration}ms`);
  }

  // Database operations
  dbQuery(query: string, duration?: number) {
    pinoLogger.debug({ type: 'db_query', query, durationMs: duration }, `DB Query: ${query}`);
  }

  // Image processing
  imageProcessing(type: string, userId: string, details?: any) {
    pinoLogger.info({ type: 'image_processing', processingType: type, userId, ...details }, `Image processing: ${type}`);
  }

  // Security events
  security(event: string, data?: any) {
    pinoLogger.warn({ type: 'security', event, ...data }, `[SECURITY] ${event}`);
  }

  // Business events
  event(event: string, data?: any) {
    pinoLogger.info({ type: 'event', event, ...data }, event);
  }
}

export const logger = new Logger();

// Export raw pino logger for advanced usage
export { pinoLogger };

/**
 * Performance measurement decorator
 */
export function measurePerformance<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  label: string
): T {
  return (async (...args: any[]) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      logger.performance(label, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`${label} failed after ${duration}ms`, error);
      throw error;
    }
  }) as T;
}

/**
 * Error handler for API routes
 */
export function handleApiError(error: any, context?: string): Response {
  logger.error(context || 'API Error', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  return new Response(
    JSON.stringify({
      error: message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
