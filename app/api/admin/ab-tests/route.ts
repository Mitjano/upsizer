import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createABTest, updateABTest, deleteABTest, recordABTestEvent, calculateABTestWinner, type ABTest } from '@/lib/db';
import { nanoid } from 'nanoid';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';
import { createABTestSchema, abTestActionSchema, validateRequest, formatZodErrors } from '@/lib/validation';

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
    const { action } = body;

    // Handle actions (calculate_winner, record_event)
    if (action) {
      const actionValidation = validateRequest(abTestActionSchema, body);
      if (!actionValidation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: formatZodErrors(actionValidation.errors) },
          { status: 400 }
        );
      }

      if (actionValidation.data.action === 'calculate_winner') {
        const result = calculateABTestWinner(actionValidation.data.testId);
        if (!result) {
          return NextResponse.json({ error: 'Cannot calculate winner' }, { status: 400 });
        }
        updateABTest(actionValidation.data.testId, { winner: result.winner, confidence: result.confidence });
        return NextResponse.json({ success: true, ...result });
      }

      if (actionValidation.data.action === 'record_event') {
        recordABTestEvent(
          actionValidation.data.testId,
          actionValidation.data.variantId!,
          actionValidation.data.eventType!
        );
        return NextResponse.json({ success: true });
      }
    }

    // Handle create test - validate with createABTestSchema
    const validation = validateRequest(createABTestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    // Ensure all variants have required fields and IDs
    const processedVariants = validation.data.variants.map((v) => ({
      id: v.id || nanoid(),
      name: v.name,
      description: v.description || '',
      traffic: v.traffic || 0,
      conversions: 0,
      visitors: 0,
    }));

    const test = createABTest({
      name: validation.data.name,
      description: validation.data.description || '',
      type: validation.data.type,
      status: 'draft',
      variants: processedVariants,
      targetMetric: validation.data.targetMetric || 'conversions',
      targetUrl: validation.data.targetUrl,
      createdBy: session.user.email || 'Unknown',
    });

    return NextResponse.json({ success: true, test });
  } catch (error) {
    return handleApiError(error, 'admin/a/b-test-creation', 'Failed to create A/B test');
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
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const test = updateABTest(id, updates);

    if (!test) {
      return NextResponse.json({ error: 'A/B test not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, test });
  } catch (error) {
    return handleApiError(error, 'admin/a/b-test-update', 'Failed to update A/B test');
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

    const success = deleteABTest(id);
    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error, 'admin/a/b-test-delete', 'Failed to delete A/B test');
  }
}
