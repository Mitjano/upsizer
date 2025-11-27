import { NextResponse } from 'next/server';
import { getRealTimeStats } from '@/lib/analytics';

export async function GET() {
  try {
    const stats = await getRealTimeStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Real-time analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time stats' },
      { status: 500 }
    );
  }
}

// Disable caching for real-time data
export const dynamic = 'force-dynamic';
