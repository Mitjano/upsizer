import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createApiKey, revokeApiKey, deleteApiKey } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, name, rateLimit, status } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = createApiKey({
      userId,
      name,
      status,
      rateLimit: rateLimit || 100,
    });

    return NextResponse.json({ success: true, apiKey });
  } catch (error) {
    return handleApiError(error, 'admin/api-key-creation', 'Failed to create API key');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'revoke') {
      const success = revokeApiKey(id);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return handleApiError(error, 'admin/api-key-update', 'Failed to update API key');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const success = deleteApiKey(id);
    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error, 'admin/api-key-delete', 'Failed to delete API key');
  }
}
