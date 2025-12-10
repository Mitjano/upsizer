import { z } from 'zod';

/**
 * Environment Variables Schema
 *
 * This file validates all required environment variables at build/startup time.
 * If any required variable is missing or invalid, the app will fail to start
 * with a clear error message.
 */

// Server-side environment variables schema
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url().optional(),
  USE_POSTGRES: z.string().optional(),

  // Authentication
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),

  // Admin
  ADMIN_EMAILS: z.string().optional().default(''),

  // AI Services - Replicate
  REPLICATE_API_TOKEN: z.string().startsWith('r8_', 'REPLICATE_API_TOKEN must start with r8_').optional(),

  // AI Services - Fal.ai
  FAL_API_KEY: z.string().optional(),

  // AI Services - PiAPI
  PIAPI_API_KEY: z.string().optional(),

  // AI Services - Runway
  RUNWAY_API_KEY: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_').optional(),

  // Stripe Price IDs (optional)
  STRIPE_PRICE_STARTER_MONTHLY: z.string().optional(),
  STRIPE_PRICE_STARTER_YEARLY: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_MONTHLY: z.string().optional(),
  STRIPE_PRICE_BUSINESS_YEARLY: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE_YEARLY: z.string().optional(),
  STRIPE_PRICE_CREDITS_15: z.string().optional(),
  STRIPE_PRICE_CREDITS_50: z.string().optional(),
  STRIPE_PRICE_CREDITS_100: z.string().optional(),
  STRIPE_PRICE_CREDITS_250: z.string().optional(),
  STRIPE_PRICE_CREDITS_1000: z.string().optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().startsWith('re_', 'RESEND_API_KEY must start with re_').optional(),

  // Firebase Admin (server-side)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().optional(),

  // Webhooks
  WEBHOOK_SECRET: z.string().optional(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Google Ads (SEO features)
  GOOGLE_ADS_CLIENT_ID: z.string().optional(),
  GOOGLE_ADS_CLIENT_SECRET: z.string().optional(),
  GOOGLE_ADS_DEVELOPER_TOKEN: z.string().optional(),
  GOOGLE_ADS_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_ADS_CUSTOMER_ID: z.string().optional(),

  // Storage paths
  VIDEOS_STORAGE_PATH: z.string().optional(),
  THUMBNAILS_STORAGE_PATH: z.string().optional(),
});

// Client-side environment variables schema (NEXT_PUBLIC_*)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

// Type exports
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Validates server-side environment variables
 * Call this at app startup to ensure all required vars are present
 */
export function validateServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid server environment variables:');
    const errors = parsed.error.flatten().fieldErrors;
    Object.entries(errors).forEach(([key, messages]) => {
      console.error(`  ${key}: ${messages?.join(', ')}`);
    });

    // In development, warn but don't crash
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Continuing with missing env vars in development mode');
      return process.env as unknown as ServerEnv;
    }

    throw new Error('Invalid server environment variables. Check the logs above.');
  }

  return parsed.data;
}

/**
 * Validates client-side environment variables
 */
export function validateClientEnv(): ClientEnv {
  const clientEnv: Record<string, string | undefined> = {};

  // Only include NEXT_PUBLIC_ variables
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      clientEnv[key] = process.env[key];
    }
  });

  const parsed = clientEnvSchema.safeParse(clientEnv);

  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:');
    const errors = parsed.error.flatten().fieldErrors;
    Object.entries(errors).forEach(([key, messages]) => {
      console.error(`  ${key}: ${messages?.join(', ')}`);
    });

    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Continuing with missing env vars in development mode');
      return clientEnv as unknown as ClientEnv;
    }

    throw new Error('Invalid client environment variables. Check the logs above.');
  }

  return parsed.data;
}

/**
 * Helper to safely get an environment variable with type checking
 */
export function getEnv<K extends keyof ServerEnv>(key: K): ServerEnv[K] {
  return process.env[key] as ServerEnv[K];
}

/**
 * Check if a feature is enabled based on env var
 */
export function isFeatureEnabled(feature: string): boolean {
  const value = process.env[`FEATURE_${feature.toUpperCase()}`];
  return value === 'true' || value === '1';
}

/**
 * Get admin emails as array
 */
export function getAdminEmails(): string[] {
  const emails = process.env.ADMIN_EMAILS || '';
  return emails.split(',').map(e => e.trim()).filter(Boolean);
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// Validate on module load (can be disabled for testing)
if (typeof window === 'undefined' && process.env.SKIP_ENV_VALIDATION !== 'true') {
  // Only validate on server-side
  try {
    validateServerEnv();
  } catch {
    // Error already logged, don't crash in development
    if (process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
  }
}
