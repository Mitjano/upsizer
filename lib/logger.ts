/**
 * Simple logging utility for development and production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry = this.formatMessage(level, message, data);

    if (this.isDev) {
      // Pretty print in development
      const color = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[34m',  // Blue
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      }[level];

      console.log(
        `${color}[${entry.timestamp}] ${level.toUpperCase()}\x1b[0m: ${message}`,
        data ? data : ''
      );
    } else {
      // JSON format in production for better parsing
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, data?: any) {
    if (this.isDev) {
      this.log('debug', message, data);
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : error;

    this.log('error', message, errorData);
  }

  // API-specific logging
  apiRequest(method: string, path: string, userId?: string) {
    this.info(`API ${method} ${path}`, { userId });
  }

  apiError(method: string, path: string, error: any, userId?: string) {
    this.error(`API ${method} ${path} failed`, { error, userId });
  }

  // Performance logging
  performance(operation: string, duration: number) {
    this.info(`Performance: ${operation} took ${duration}ms`);
  }

  // Database operations
  dbQuery(query: string, duration?: number) {
    this.debug(`DB Query: ${query}`, { duration });
  }

  // Image processing
  imageProcessing(type: string, userId: string, details?: any) {
    this.info(`Image processing: ${type}`, { userId, ...details });
  }
}

export const logger = new Logger();

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
