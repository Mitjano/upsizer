/**
 * API Keys Management Endpoint
 * GET /api/v1/keys - List user's API keys
 * POST /api/v1/keys - Create new API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserByEmail,
  getApiKeysByUserId,
  createApiKey,
} from '@/lib/database';
import { apiKeyCreationLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';

// Fixed rate limit for all users (100 requests per minute)
const API_RATE_LIMIT = 100;

/**
 * GET /api/v1/keys
 * Get all API keys for the authenticated user
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'User not found', code: 'USER_NOT_FOUND' } },
        { status: 404 }
      );
    }

    const keys = await getApiKeysByUserId(user.id);
    const activeKeys = keys.filter((k) => (k as any).isActive ?? (k as any).status === 'active');
    const totalRequests = keys.reduce((sum, k) => sum + (k.usageCount || 0), 0);

    // Find last used key
    const lastUsedKey = keys
      .filter((k) => k.lastUsedAt)
      .sort((a, b) => {
        const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        return bTime - aTime;
      })[0];

    return NextResponse.json({
      success: true,
      data: {
        keys: keys.map((k) => ({
          id: k.id,
          name: k.name,
          key: (k as any).keyPrefix || ((k as any).key?.substring(0, 12) + '...') || 'pk_****',
          environment: (k as any).environment || 'live',
          is_active: (k as any).isActive ?? (k as any).status === 'active',
          rate_limit: API_RATE_LIMIT,
          usage_count: k.usageCount || 0,
          created_at: k.createdAt,
          last_used_at: k.lastUsedAt || null,
          expires_at: k.expiresAt || null,
        })),
        stats: {
          total_keys: keys.length,
          active_keys: activeKeys.length,
          total_requests: totalRequests,
          last_used: lastUsedKey?.lastUsedAt || null,
        },
        account: {
          credits: user.credits || 0,
          rate_limit: API_RATE_LIMIT,
        },
      },
    });
  } catch (error) {
    console.error('API Keys GET error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to get API keys', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for API key creation
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiKeyCreationLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'User not found', code: 'USER_NOT_FOUND' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, environment = 'live' } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Name is required', code: 'INVALID_INPUT' } },
        { status: 400 }
      );
    }

    if (environment !== 'live' && environment !== 'test') {
      return NextResponse.json(
        { success: false, error: { message: 'Environment must be "live" or "test"', code: 'INVALID_INPUT' } },
        { status: 400 }
      );
    }

    // Check key limit (max 10 keys per user)
    const existingKeys = await getApiKeysByUserId(user.id);
    if (existingKeys.length >= 10) {
      return NextResponse.json(
        { success: false, error: { message: 'Maximum 10 API keys allowed', code: 'KEY_LIMIT_REACHED' } },
        { status: 400 }
      );
    }

    const apiKey = await createApiKey({
      userId: user.id,
      name: name.trim(),
      environment,
      rateLimit: API_RATE_LIMIT,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: (apiKey as any).key, // Full key - only shown once!
        key_prefix: (apiKey as any).keyPrefix || (apiKey as any).key?.substring(0, 12) + '...',
        environment: (apiKey as any).environment || 'live',
        rate_limit: API_RATE_LIMIT,
        created_at: apiKey.createdAt,
      },
      message: 'API key created successfully. Save this key securely - it will only be shown once!',
    }, { status: 201 });
  } catch (error) {
    console.error('API Keys POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to create API key', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
