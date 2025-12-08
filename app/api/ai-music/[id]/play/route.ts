import { NextRequest, NextResponse } from 'next/server';
import { incrementPlays } from '@/lib/ai-music';

// POST - Increment play count
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Increment play count (no auth required for public tracks)
    await incrementPlays(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Increment plays error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
