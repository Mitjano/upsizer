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

export async function POST(request: NextRequest) {
  try {
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

    if (!name || !ruleType || !target || !severity || !actionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const rule = createModerationRule({
      name,
      type: ruleType,
      target,
      severity,
      action: actionType,
      keywords: keywords ? keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : [],
      pattern: pattern || undefined,
      enabled: enabled ?? true,
    });

    return NextResponse.json({ success: true, rule });
  } catch (error) {
    console.error('Moderation operation error:', error);
    return NextResponse.json({ error: 'Failed to perform moderation operation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
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
    console.error('Moderation update error:', error);
    return NextResponse.json({ error: 'Failed to update moderation rule' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
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
    console.error('Moderation delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
