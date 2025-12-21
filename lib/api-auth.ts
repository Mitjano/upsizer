/**
 * API Authentication Helper
 * Supports both session-based auth and API key auth
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { auth } from '@/lib/auth';
import { getUserByEmail, getUserById, getApiKeyByKey, incrementApiKeyUsage } from '@/lib/database';
import { updateUserActivity } from '@/lib/db';

// Standard rate limit for all API users (requests per minute)
export const API_RATE_LIMIT = 100;

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    credits: number;
    totalUsage: number;
  };
  apiKeyId?: string;
  error?: string;
  statusCode?: number;
}

/**
 * Hash API key for lookup
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Authenticate a request using either session or API key
 *
 * Supports:
 * - Session cookie (for web UI)
 * - X-API-Key header
 * - Authorization: Bearer pk_xxx header
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // Try API key first (from headers)
  const apiKey = extractApiKey(request);

  let result: AuthResult;

  if (apiKey) {
    result = await authenticateWithApiKey(apiKey);
  } else {
    // Fall back to session auth
    result = await authenticateWithSession();
  }

  // Update lastActiveAt for successful authentications (fire-and-forget)
  if (result.success && result.user?.id) {
    updateUserActivity(result.user.id).catch(() => {
      // Silently ignore errors - activity tracking should not affect main flow
    });
  }

  return result;
}

/**
 * Extract API key from request headers
 */
function extractApiKey(request: NextRequest): string | null {
  // Check X-API-Key header
  const xApiKey = request.headers.get('x-api-key');
  if (xApiKey) {
    return xApiKey;
  }

  // Check Authorization: Bearer header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    // Only treat as API key if it starts with pk_
    if (token.startsWith('pk_')) {
      return token;
    }
  }

  return null;
}

/**
 * Authenticate using API key
 */
async function authenticateWithApiKey(apiKey: string): Promise<AuthResult> {
  // Validate key format
  if (!apiKey.startsWith('pk_live_') && !apiKey.startsWith('pk_test_')) {
    return {
      success: false,
      error: 'Invalid API key format',
      statusCode: 401,
    };
  }

  // Hash and lookup
  const keyHash = hashApiKey(apiKey);
  const keyRecord = await getApiKeyByKey(apiKey);

  if (!keyRecord) {
    return {
      success: false,
      error: 'Invalid API key',
      statusCode: 401,
    };
  }

  // Check if key is active
  const isActive = (keyRecord as any).isActive ?? (keyRecord as any).status === 'active';
  if (!isActive) {
    return {
      success: false,
      error: 'API key is deactivated',
      statusCode: 401,
    };
  }

  // Check expiration
  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    return {
      success: false,
      error: 'API key has expired',
      statusCode: 401,
    };
  }

  // Get user associated with key
  const user = await getUserById(keyRecord.userId);

  if (!user) {
    return {
      success: false,
      error: 'User not found',
      statusCode: 404,
    };
  }

  // Increment API key usage
  await incrementApiKeyUsage(apiKey);

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || null,
      credits: user.credits || 0,
      totalUsage: user.totalUsage || 0,
    },
    apiKeyId: keyRecord.id,
  };
}

/**
 * Authenticate using session
 */
async function authenticateWithSession(): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.email) {
    return {
      success: false,
      error: 'Authentication required. Provide an API key via X-API-Key header or sign in.',
      statusCode: 401,
    };
  }

  const user = await getUserByEmail(session.user.email);

  if (!user) {
    return {
      success: false,
      error: 'User not found',
      statusCode: 404,
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name || null,
      credits: user.credits || 0,
      totalUsage: user.totalUsage || 0,
    },
  };
}

/**
 * Check if user has enough credits
 */
export function checkCredits(userCredits: number, required: number): { hasEnough: boolean; available: number } {
  return {
    hasEnough: userCredits >= required,
    available: userCredits,
  };
}
