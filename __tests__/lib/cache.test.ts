import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis client
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
};

vi.mock('@/lib/redis', () => ({
  getRedisClient: () => mockRedis,
}));

import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  cacheGetOrSet,
  getFromRequestCache,
  setInRequestCache,
} from '@/lib/cache';

describe('cache.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.get.mockResolvedValue(null);
    mockRedis.set.mockResolvedValue('OK');
    mockRedis.del.mockResolvedValue(1);
    mockRedis.keys.mockResolvedValue([]);
  });

  describe('cacheGet', () => {
    it('should return null when cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheGet('nonexistent');
      expect(result).toBeNull();
    });

    it('should return parsed value on cache hit', async () => {
      const data = { name: 'Test', value: 42 };
      mockRedis.get.mockResolvedValue(JSON.stringify(data));

      const result = await cacheGet<typeof data>('test-key');
      expect(result).toEqual(data);
    });

    it('should use default prefix', async () => {
      await cacheGet('my-key');
      expect(mockRedis.get).toHaveBeenCalledWith('cache:my-key');
    });

    it('should use custom prefix', async () => {
      await cacheGet('my-key', { prefix: 'custom:' });
      expect(mockRedis.get).toHaveBeenCalledWith('custom:my-key');
    });

    it('should return null on Redis error', async () => {
      mockRedis.get.mockRejectedValue(new Error('Connection failed'));

      const result = await cacheGet('error-key');
      expect(result).toBeNull();
    });
  });

  describe('cacheSet', () => {
    it('should set value with default TTL', async () => {
      const data = { test: true };
      await cacheSet('key', data);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'cache:key',
        JSON.stringify(data),
        'EX',
        300 // default 5 minutes
      );
    });

    it('should set value with custom TTL', async () => {
      await cacheSet('key', 'value', { ttl: 60 });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'cache:key',
        '"value"',
        'EX',
        60
      );
    });

    it('should return true on success', async () => {
      const result = await cacheSet('key', 'value');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockRedis.set.mockRejectedValue(new Error('Write failed'));

      const result = await cacheSet('key', 'value');
      expect(result).toBe(false);
    });
  });

  describe('cacheDelete', () => {
    it('should delete key', async () => {
      await cacheDelete('key-to-delete');

      expect(mockRedis.del).toHaveBeenCalledWith('cache:key-to-delete');
    });

    it('should return true on success', async () => {
      const result = await cacheDelete('key');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockRedis.del.mockRejectedValue(new Error('Delete failed'));

      const result = await cacheDelete('key');
      expect(result).toBe(false);
    });
  });

  describe('cacheDeletePattern', () => {
    it('should delete all matching keys', async () => {
      mockRedis.keys.mockResolvedValue(['cache:user:1', 'cache:user:2', 'cache:user:3']);

      const count = await cacheDeletePattern('user:*');

      expect(mockRedis.keys).toHaveBeenCalledWith('cache:user:*');
      expect(mockRedis.del).toHaveBeenCalledWith('cache:user:1', 'cache:user:2', 'cache:user:3');
      expect(count).toBe(3);
    });

    it('should return 0 when no keys match', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const count = await cacheDeletePattern('nonexistent:*');
      expect(count).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('cacheGetOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedData = { cached: true };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const callback = vi.fn().mockResolvedValue({ fresh: true });

      const result = await cacheGetOrSet('key', callback);

      expect(result).toEqual(cachedData);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should call callback on cache miss', async () => {
      mockRedis.get.mockResolvedValue(null);
      const freshData = { fresh: true };
      const callback = vi.fn().mockResolvedValue(freshData);

      const result = await cacheGetOrSet('key', callback);

      expect(result).toEqual(freshData);
      expect(callback).toHaveBeenCalled();
    });

    it('should cache callback result', async () => {
      mockRedis.get.mockResolvedValue(null);
      const freshData = { fresh: true };
      const callback = vi.fn().mockResolvedValue(freshData);

      await cacheGetOrSet('key', callback);

      // Give time for fire-and-forget set
      await new Promise((r) => setTimeout(r, 10));

      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  describe('Request Cache (in-memory)', () => {
    it('should store and retrieve values', () => {
      setInRequestCache('req-key', { data: 'test' }, 5000);

      const result = getFromRequestCache<{ data: string }>('req-key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for nonexistent keys', () => {
      const result = getFromRequestCache('nonexistent');
      expect(result).toBeNull();
    });

    it('should expire entries', async () => {
      setInRequestCache('expiring', 'value', 50); // 50ms TTL

      // Should exist immediately
      expect(getFromRequestCache('expiring')).toBe('value');

      // Wait for expiry
      await new Promise((r) => setTimeout(r, 100));

      // Should be expired
      expect(getFromRequestCache('expiring')).toBeNull();
    });
  });
});
