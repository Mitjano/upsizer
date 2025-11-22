import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAnalyticsStats, getRealTimeStats } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.email !== 'michalchmielarz00@gmail.com') {
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
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
