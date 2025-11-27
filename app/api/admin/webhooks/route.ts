import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createWebhook, updateWebhook, deleteWebhook, triggerWebhook } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';
import { createWebhookSchema, updateWebhookSchema, validateRequest, formatZodErrors } from '@/lib/validation';

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
    const { action, webhookId, event, payload } = body;

    // Handle test webhook trigger
    if (action === 'test' && webhookId) {
      await triggerWebhook(webhookId, event || 'test.event', payload || { test: true, timestamp: new Date().toISOString() });
      return NextResponse.json({ success: true, message: 'Test webhook triggered' });
    }

    // Handle create webhook
    const { name, url, events, enabled, secret, headers, retryAttempts } = body;

    // Validate request (partial - allow extra fields like headers, retryAttempts)
    const validation = validateRequest(createWebhookSchema, { name, url, events, secret, enabled });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const webhook = createWebhook({
      name: validation.data.name,
      url: validation.data.url,
      events: validation.data.events,
      enabled: validation.data.enabled ?? true,
      secret: validation.data.secret,
      headers: headers || {},
      retryAttempts: retryAttempts ?? 3,
    });

    return NextResponse.json({ success: true, webhook });
  } catch (error) {
    return handleApiError(error, 'admin/webhook-creation', 'Failed to create webhook');
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

    // If events is a string, convert to array
    if (updates.events && typeof updates.events === 'string') {
      updates.events = updates.events.split(',').map((e: string) => e.trim()).filter((e: string) => e);
    }

    const webhook = updateWebhook(id, updates);

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, webhook });
  } catch (error) {
    return handleApiError(error, 'admin/webhook-update', 'Failed to update webhook');
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

    const success = deleteWebhook(id);
    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error, 'admin/webhook-delete', 'Failed to delete webhook');
  }
}
