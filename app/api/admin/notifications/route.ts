import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/db';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';

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

    if (action === 'mark_all_read') {
      markAllNotificationsAsRead();
      return NextResponse.json({ success: true });
    }

    if (action === 'mark_read' && id) {
      const notification = markNotificationAsRead(id);
      return NextResponse.json({ success: true, notification });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return handleApiError(error, 'admin/notification-update', 'Failed to update notification');
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

    const success = deleteNotification(id);
    return NextResponse.json({ success });
  } catch (error) {
    return handleApiError(error, 'admin/notification-delete', 'Failed to delete notification');
  }
}
