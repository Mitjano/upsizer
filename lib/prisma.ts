/**
 * Prisma Client Singleton
 * Ensures a single instance of PrismaClient is used across the application
 * Compatible with Prisma 7 - uses @prisma/adapter-pg for direct PostgreSQL connections
 */

import { PrismaClient } from './generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Create a global variable to store the Prisma client in development
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

// Only create Prisma client when USE_POSTGRES is enabled
const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

// Create the Prisma client with the PostgreSQL adapter (lazy)
const prismaClientSingleton = (): PrismaClient | null => {
  // Skip Prisma client creation when not using PostgreSQL
  if (!USE_POSTGRES) {
    return null;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[prisma] DATABASE_URL is not set');
    return null;
  }

  // Create a connection pool with optimized settings
  const pool = new Pool({
    connectionString,
    // Pool configuration
    max: parseInt(process.env.DATABASE_POOL_MAX || '20', 10),  // Maximum connections
    min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),   // Minimum connections to keep
    idleTimeoutMillis: 30000,  // Close idle connections after 30s
    connectionTimeoutMillis: 10000,  // Timeout for acquiring connection
    maxUses: 7500,  // Recycle connections after N queries (prevents memory leaks)
  });
  globalThis.__pgPool = pool;

  // Create the Prisma adapter
  const adapter = new PrismaPg(pool);

  // Create PrismaClient with the adapter
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
};

// Use the global instance in development to prevent too many connections
// Returns null if USE_POSTGRES is not enabled
const prismaInstance = globalThis.__prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production' && prismaInstance) {
  globalThis.__prisma = prismaInstance;
}

// Export prisma (may be null if USE_POSTGRES is false)
export const prisma = prismaInstance as PrismaClient;

// Export types for convenience
export * from './generated/prisma';
