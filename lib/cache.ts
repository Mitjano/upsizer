/**
 * Redis-based caching layer with automatic fallback
 * Provides caching for frequently accessed data
 */

import { getRedisClient } from './redis';

export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number;
  /** Cache key prefix */
  prefix?: string;
}

const DEFAULT_TTL = 300; // 5 minutes
const CACHE_PREFIX = 'cache:';

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string, options?: CacheOptions): Promise<T | null> {
  const prefix = options?.prefix || CACHE_PREFIX;
  const fullKey = `${prefix}${key}`;

  try {
    const redis = getRedisClient();
    const value = await redis.get(fullKey);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Cache get error:', error);
    return null;
  }
}

/**
 * Set value in cache
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<boolean> {
  const prefix = options?.prefix || CACHE_PREFIX;
  const ttl = options?.ttl || DEFAULT_TTL;
  const fullKey = `${prefix}${key}`;

  try {
    const redis = getRedisClient();
    await redis.set(fullKey, JSON.stringify(value), 'EX', ttl);
    return true;
  } catch (error) {
    console.warn('Cache set error:', error);
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string, options?: CacheOptions): Promise<boolean> {
  const prefix = options?.prefix || CACHE_PREFIX;
  const fullKey = `${prefix}${key}`;

  try {
    const redis = getRedisClient();
    await redis.del(fullKey);
    return true;
  } catch (error) {
    console.warn('Cache delete error:', error);
    return false;
  }
}

/**
 * Delete all cache keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string, options?: CacheOptions): Promise<number> {
  const prefix = options?.prefix || CACHE_PREFIX;
  const fullPattern = `${prefix}${pattern}`;

  try {
    const redis = getRedisClient();
    const keys = await redis.keys(fullPattern);

    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    return keys.length;
  } catch (error) {
    console.warn('Cache delete pattern error:', error);
    return 0;
  }
}

/**
 * Get or set cache with callback
 * If cache miss, calls the callback and caches the result
 */
export async function cacheGetOrSet<T>(
  key: string,
  callback: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key, options);

  if (cached !== null) {
    return cached;
  }

  // Cache miss - call callback
  const value = await callback();

  // Store in cache (don't await, fire and forget)
  cacheSet(key, value, options).catch(() => {});

  return value;
}

/**
 * Invalidate cache after mutation
 */
export async function invalidateCache(patterns: string[]): Promise<void> {
  await Promise.all(patterns.map((pattern) => cacheDeletePattern(pattern)));
}

// Specific cache functions for common use cases

/**
 * Cache user data
 */
export async function cacheUser(userId: string, userData: unknown): Promise<void> {
  await cacheSet(`user:${userId}`, userData, { ttl: 60 }); // 1 minute
}

export async function getCachedUser<T>(userId: string): Promise<T | null> {
  return cacheGet<T>(`user:${userId}`);
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await cacheDelete(`user:${userId}`);
}

/**
 * Cache analytics data (longer TTL)
 */
export async function cacheAnalytics(key: string, data: unknown): Promise<void> {
  await cacheSet(`analytics:${key}`, data, { ttl: 300 }); // 5 minutes
}

export async function getCachedAnalytics<T>(key: string): Promise<T | null> {
  return cacheGet<T>(`analytics:${key}`);
}

/**
 * Cache blog posts
 */
export async function cacheBlogPost(slug: string, post: unknown): Promise<void> {
  await cacheSet(`blog:${slug}`, post, { ttl: 600 }); // 10 minutes
}

export async function getCachedBlogPost<T>(slug: string): Promise<T | null> {
  return cacheGet<T>(`blog:${slug}`);
}

export async function invalidateBlogCache(): Promise<void> {
  await cacheDeletePattern('blog:*');
}

/**
 * Cache settings/config (longer TTL)
 */
export async function cacheSettings(key: string, settings: unknown): Promise<void> {
  await cacheSet(`settings:${key}`, settings, { ttl: 3600 }); // 1 hour
}

export async function getCachedSettings<T>(key: string): Promise<T | null> {
  return cacheGet<T>(`settings:${key}`);
}

/**
 * Cache stats for dashboard
 */
export async function cacheDashboardStats(stats: unknown): Promise<void> {
  await cacheSet('dashboard:stats', stats, { ttl: 60 }); // 1 minute
}

export async function getCachedDashboardStats<T>(): Promise<T | null> {
  return cacheGet<T>('dashboard:stats');
}

/**
 * Simple in-memory cache for static data during request lifecycle
 */
const requestCache = new Map<string, { value: unknown; expires: number }>();

export function getFromRequestCache<T>(key: string): T | null {
  const entry = requestCache.get(key);
  if (!entry) return null;

  if (entry.expires < Date.now()) {
    requestCache.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setInRequestCache<T>(key: string, value: T, ttlMs: number = 5000): void {
  requestCache.set(key, { value, expires: Date.now() + ttlMs });
}

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of requestCache.entries()) {
      if (entry.expires < now) {
        requestCache.delete(key);
      }
    }
  }, 60000); // Every minute
}
