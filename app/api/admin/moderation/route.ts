import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createModerationRule,
  updateModerationRule,
  deleteModerationRule,
  updateModerationQueue,
  deleteModerationQueueItem,
  moderateContent,
} from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';
import { createModerationRuleSchema, reviewModerationQueueSchema, validateRequest, formatZodErrors } from '@/lib/validation';

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
    const { type, action } = body;

    // Handle moderation queue actions
    if (type === 'queue') {
      const { queueId, status, notes } = body;

      if (action === 'review' && queueId) {
        const updated = updateModerationQueue(queueId, {
          status,
          notes,
          reviewedBy: session.user.email || 'Unknown',
          reviewedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, item: updated });
      }

      if (action === 'test_moderation') {
        const { contentType, content, author } = body;
        const result = moderateContent(
          contentType || 'other',
          'test-' + Date.now(),
          content || '',
          author || 'Test User'
        );
        return NextResponse.json({ success: true, result });
      }
    }

    // Handle rule creation
    const { name, ruleType, target, severity, actionType, keywords, pattern, enabled } = body;

    // Validate request
    const ruleData = {
      name,
      type: ruleType,
      target,
      severity,
      action: actionType,
      keywords: keywords ? (typeof keywords === 'string' ? keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : keywords) : undefined,
      pattern,
      enabled: enabled ?? true,
    };

    const validation = validateRequest(createModerationRuleSchema, ruleData);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodErrors(validation.errors)
        },
        { status: 400 }
      );
    }

    const rule = createModerationRule(validation.data);

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    return handleApiError(error, 'admin/moderation-operation', 'Failed to perform moderation operation');
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

    // Handle keyword string to array conversion
    if (updates.keywords && typeof updates.keywords === 'string') {
      updates.keywords = updates.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k);
    }

    const rule = updateModerationRule(id, updates);

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    return handleApiError(error, 'admin/moderation-update', 'Failed to update moderation rule');
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
    const type = url.searchParams.get('type');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    let success = false;
    if (type === 'queue') {
      success = deleteModerationQueueItem(id);
    } else {
      success = deleteModerationRule(id);
    }

    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error, 'admin/moderation-delete', 'Failed to delete');
  }
}
