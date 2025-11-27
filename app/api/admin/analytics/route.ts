import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAnalyticsStats, getRealTimeStats } from '@/lib/analytics';
import { apiLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = apiLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();

    if (!session || !session.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    const days = parseInt(searchParams.get('days') || '30');

    if (type === 'realtime') {
      const realtimeStats = await getRealTimeStats();
      return NextResponse.json(realtimeStats);
    }

    const stats = await getAnalyticsStats(days);
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error, 'admin/analytics:GET', 'Failed to fetch analytics');
  }
}
