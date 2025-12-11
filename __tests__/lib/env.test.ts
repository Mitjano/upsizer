import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateServerEnv,
  validateClientEnv,
  getEnv,
  isFeatureEnabled,
  getAdminEmails,
  isProduction,
  isDevelopment,
} from '@/lib/env';

describe('env.ts', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    // Suppress console output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('validateServerEnv', () => {
    it('should pass with valid environment variables', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXTAUTH_SECRET = 'this-is-a-secret-that-is-long-enough';
      process.env.GOOGLE_CLIENT_ID = 'google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';

      expect(() => validateServerEnv()).not.toThrow();
    });

    it('should accept valid NODE_ENV values', () => {
      process.env.NEXTAUTH_SECRET = 'this-is-a-secret-that-is-long-enough';
      process.env.GOOGLE_CLIENT_ID = 'google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';

      process.env.NODE_ENV = 'development';
      expect(() => validateServerEnv()).not.toThrow();

      process.env.NODE_ENV = 'production';
      expect(() => validateServerEnv()).not.toThrow();

      process.env.NODE_ENV = 'test';
      expect(() => validateServerEnv()).not.toThrow();
    });

    it('should warn in development mode with missing vars', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXTAUTH_SECRET = 'short'; // Too short
      process.env.GOOGLE_CLIENT_ID = '';
      process.env.GOOGLE_CLIENT_SECRET = '';

      const consoleSpy = vi.spyOn(console, 'warn');

      // Should not throw in development
      expect(() => validateServerEnv()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should validate REPLICATE_API_TOKEN format', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXTAUTH_SECRET = 'this-is-a-secret-that-is-long-enough';
      process.env.GOOGLE_CLIENT_ID = 'google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
      process.env.REPLICATE_API_TOKEN = 'r8_valid_token';

      expect(() => validateServerEnv()).not.toThrow();
    });

    it('should validate STRIPE_SECRET_KEY format', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXTAUTH_SECRET = 'this-is-a-secret-that-is-long-enough';
      process.env.GOOGLE_CLIENT_ID = 'google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
      process.env.STRIPE_SECRET_KEY = 'sk_test_valid';

      expect(() => validateServerEnv()).not.toThrow();
    });

    it('should validate DATABASE_URL as URL', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXTAUTH_SECRET = 'this-is-a-secret-that-is-long-enough';
      process.env.GOOGLE_CLIENT_ID = 'google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

      expect(() => validateServerEnv()).not.toThrow();
    });

    it('should validate RESEND_API_KEY format', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXTAUTH_SECRET = 'this-is-a-secret-that-is-long-enough';
      process.env.GOOGLE_CLIENT_ID = 'google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';
      process.env.RESEND_API_KEY = 're_valid_key';

      expect(() => validateServerEnv()).not.toThrow();
    });
  });

  describe('validateClientEnv', () => {
    it('should pass with valid client environment variables', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

      expect(() => validateClientEnv()).not.toThrow();
    });

    it('should validate NEXT_PUBLIC_API_URL as URL', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

      const result = validateClientEnv();
      expect(result.NEXT_PUBLIC_API_URL).toBe('https://api.example.com');
    });

    it('should only include NEXT_PUBLIC_ variables', () => {
      process.env.NODE_ENV = 'development';
      process.env.SECRET_VAR = 'should-not-be-included';
      process.env.NEXT_PUBLIC_TEST = 'should-be-included';

      const result = validateClientEnv();
      expect(result).not.toHaveProperty('SECRET_VAR');
    });
  });

  describe('getEnv', () => {
    it('should return environment variable value', () => {
      process.env.NODE_ENV = 'production';
      expect(getEnv('NODE_ENV')).toBe('production');
    });

    it('should return undefined for missing variables', () => {
      delete process.env.REDIS_URL;
      expect(getEnv('REDIS_URL')).toBeUndefined();
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true when feature is set to true', () => {
      process.env.FEATURE_DARK_MODE = 'true';
      expect(isFeatureEnabled('dark_mode')).toBe(true);
    });

    it('should return true when feature is set to 1', () => {
      process.env.FEATURE_ANALYTICS = '1';
      expect(isFeatureEnabled('analytics')).toBe(true);
    });

    it('should return false when feature is not set', () => {
      delete process.env.FEATURE_SOME_FEATURE;
      expect(isFeatureEnabled('some_feature')).toBe(false);
    });

    it('should return false when feature is set to false', () => {
      process.env.FEATURE_BETA = 'false';
      expect(isFeatureEnabled('beta')).toBe(false);
    });

    it('should be case insensitive for feature name', () => {
      process.env.FEATURE_MY_FEATURE = 'true';
      expect(isFeatureEnabled('my_feature')).toBe(true);
      expect(isFeatureEnabled('MY_FEATURE')).toBe(true);
    });
  });

  describe('getAdminEmails', () => {
    it('should return array of admin emails', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com,super@example.com';
      const emails = getAdminEmails();

      expect(emails).toEqual(['admin@example.com', 'super@example.com']);
    });

    it('should handle single email', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';
      const emails = getAdminEmails();

      expect(emails).toEqual(['admin@example.com']);
    });

    it('should return empty array when not set', () => {
      delete process.env.ADMIN_EMAILS;
      const emails = getAdminEmails();

      expect(emails).toEqual([]);
    });

    it('should trim whitespace from emails', () => {
      process.env.ADMIN_EMAILS = '  admin@example.com  ,  user@example.com  ';
      const emails = getAdminEmails();

      expect(emails).toEqual(['admin@example.com', 'user@example.com']);
    });

    it('should filter empty strings', () => {
      process.env.ADMIN_EMAILS = 'admin@example.com,,user@example.com,';
      const emails = getAdminEmails();

      expect(emails).toEqual(['admin@example.com', 'user@example.com']);
    });
  });

  describe('isProduction', () => {
    it('should return true in production', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
    });

    it('should return false in development', () => {
      process.env.NODE_ENV = 'development';
      expect(isProduction()).toBe(false);
    });

    it('should return false in test', () => {
      process.env.NODE_ENV = 'test';
      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true in development', () => {
      process.env.NODE_ENV = 'development';
      expect(isDevelopment()).toBe(true);
    });

    it('should return false in production', () => {
      process.env.NODE_ENV = 'production';
      expect(isDevelopment()).toBe(false);
    });

    it('should return false in test', () => {
      process.env.NODE_ENV = 'test';
      expect(isDevelopment()).toBe(false);
    });
  });

  describe('environment variable format validation', () => {
    it('should validate NEXTAUTH_SECRET minimum length', () => {
      process.env.NODE_ENV = 'development'; // Use development to avoid throwing
      process.env.NEXTAUTH_SECRET = 'short';
      process.env.GOOGLE_CLIENT_ID = 'id';
      process.env.GOOGLE_CLIENT_SECRET = 'secret';

      const consoleSpy = vi.spyOn(console, 'error');
      validateServerEnv();

      // Should log error about minimum length
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should allow optional variables to be missing', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXTAUTH_SECRET = 'this-is-a-secret-that-is-long-enough';
      process.env.GOOGLE_CLIENT_ID = 'google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'google-client-secret';

      // Remove optional variables
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
      delete process.env.STRIPE_SECRET_KEY;

      expect(() => validateServerEnv()).not.toThrow();
    });
  });
});
