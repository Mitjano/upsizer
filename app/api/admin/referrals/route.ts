import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createReferral, updateReferral, deleteReferral, trackReferralClick } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';
import { createReferralSchema, trackReferralSchema, validateRequest, formatZodErrors } from '@/lib/validation';

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
    const { action, code } = body;

    if (action === 'track_click') {
      const trackValidation = validateRequest(trackReferralSchema, { code, action: 'click' });
      if (!trackValidation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: formatZodErrors(trackValidation.errors)
          },
          { status: 400 }
        );
      }
      trackReferralClick(code);
      return NextResponse.json({ success: true });
    }

    // Validate referral creation
    const validation = validateRequest(createReferralSchema, {
      referrerId: body.referrerId,
      referrerName: body.referrerName,
      code: body.referralCode,
      status: body.status || 'pending'
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodErrors(validation.errors)
        },
        { status: 400 }
      );
    }

    const referral = createReferral({
      ...validation.data,
      expiresAt: body.expiresAt,
    });

    return NextResponse.json({ success: true, referral });
  } catch (error) {
    return handleApiError(error, 'admin/referral-creation', 'Failed to create referral');
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

    const referral = updateReferral(id, updates);

    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, referral });
  } catch (error) {
    return handleApiError(error, 'admin/referral-update', 'Failed to update referral');
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

    const success = deleteReferral(id);
    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error, 'admin/referral-delete', 'Failed to delete referral');
  }
}
