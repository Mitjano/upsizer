import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createFeatureFlag, updateFeatureFlag, deleteFeatureFlag } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';
import { createFeatureFlagSchema, updateFeatureFlagSchema, validateRequest, formatZodErrors } from '@/lib/validation';

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

    // Validate request
    const validation = validateRequest(createFeatureFlagSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const { name, key, description, enabled, rolloutPercentage } = validation.data;

    const flag = createFeatureFlag({
      name,
      key,
      description: description || '',
      enabled: enabled ?? true,
      rolloutPercentage: rolloutPercentage ?? 100,
    });

    return NextResponse.json({ success: true, flag });
  } catch (error) {
    return handleApiError(error, 'admin/feature-flag-creation', 'Failed to create feature flag');
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

    // Validate request
    const validation = validateRequest(updateFeatureFlagSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const { id, updates } = validation.data;
    const flag = updateFeatureFlag(id, updates);

    if (!flag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, flag });
  } catch (error) {
    return handleApiError(error, 'admin/feature-flag-update', 'Failed to update feature flag');
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

    const success = deleteFeatureFlag(id);
    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error, 'admin/feature-flag-delete', 'Failed to delete feature flag');
  }
}
