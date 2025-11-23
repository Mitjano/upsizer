/**
 * In-memory cache system for file-based database
 * Reduces disk I/O by caching frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

class DBCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5000; // 5 seconds default

  /**
   * Get cached data or return null if expired/missing
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expires });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean expired entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const dbCache = new DBCache();

// Auto-cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => dbCache.cleanup(), 60000);
}

/**
 * Cache key generators for consistency
 */
export const CacheKeys = {
  USERS: 'users',
  USER_BY_EMAIL: (email: string) => `user:email:${email}`,
  USER_BY_ID: (id: string) => `user:id:${id}`,
  TRANSACTIONS: 'transactions',
  USAGE: 'usage',
  CAMPAIGNS: 'campaigns',
  NOTIFICATIONS: 'notifications',
  API_KEYS: 'api_keys',
  FEATURE_FLAGS: 'feature_flags',
  BACKUPS: 'backups',
  EMAIL_TEMPLATES: 'email_templates',
  REPORTS: 'reports',
  WEBHOOKS: 'webhooks',
  WEBHOOK_LOGS: 'webhook_logs',
  ABTESTS: 'abtests',
  MODERATION_RULES: 'moderation_rules',
  MODERATION_QUEUE: 'moderation_queue',
  TICKETS: 'tickets',
  REFERRALS: 'referrals',
} as const;

/**
 * Helper function to invalidate related caches after mutations
 */
export function invalidateUserCache(userId?: string, email?: string): void {
  dbCache.invalidate(CacheKeys.USERS);
  if (userId) dbCache.invalidate(CacheKeys.USER_BY_ID(userId));
  if (email) dbCache.invalidate(CacheKeys.USER_BY_EMAIL(email));
}

export function invalidateTransactionCache(): void {
  dbCache.invalidate(CacheKeys.TRANSACTIONS);
}

export function invalidateUsageCache(): void {
  dbCache.invalidate(CacheKeys.USAGE);
}

export function invalidateCampaignCache(): void {
  dbCache.invalidate(CacheKeys.CAMPAIGNS);
}

export function invalidateNotificationCache(): void {
  dbCache.invalidate(CacheKeys.NOTIFICATIONS);
}

export function invalidateAPIKeyCache(): void {
  dbCache.invalidate(CacheKeys.API_KEYS);
}

export function invalidateFeatureFlagCache(): void {
  dbCache.invalidate(CacheKeys.FEATURE_FLAGS);
}

export function invalidateBackupCache(): void {
  dbCache.invalidate(CacheKeys.BACKUPS);
}

export function invalidateEmailTemplateCache(): void {
  dbCache.invalidate(CacheKeys.EMAIL_TEMPLATES);
}

export function invalidateReportCache(): void {
  dbCache.invalidate(CacheKeys.REPORTS);
}

export function invalidateWebhookCache(): void {
  dbCache.invalidate(CacheKeys.WEBHOOKS);
  dbCache.invalidate(CacheKeys.WEBHOOK_LOGS);
}

export function invalidateABTestCache(): void {
  dbCache.invalidate(CacheKeys.ABTESTS);
}

export function invalidateModerationCache(): void {
  dbCache.invalidate(CacheKeys.MODERATION_RULES);
  dbCache.invalidate(CacheKeys.MODERATION_QUEUE);
}

export function invalidateTicketCache(): void {
  dbCache.invalidate(CacheKeys.TICKETS);
}

export function invalidateReferralCache(): void {
  dbCache.invalidate(CacheKeys.REFERRALS);
}
