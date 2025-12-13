import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createUsage, getUserByEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { type, scale, enhanceFace, imageUrl } = body;

    // Get user from database
    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate credits cost
    let creditsCost = 1;
    if (type === 'preview') {
      creditsCost = 0;
    }

    // Check if user has enough credits
    if (user.credits < creditsCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Log usage (createUsage automatically updates user credits and totalUsage)
    const usage = await createUsage({
      userId: user.id,
      type,
      creditsUsed: creditsCost,
      imageSize: scale !== undefined ? String(scale) : undefined,
      model: enhanceFace ? 'enhanced' : 'standard',
    });

    return NextResponse.json({
      success: true,
      usage,
      creditsRemaining: user.credits - creditsCost,
    });
  } catch (error) {
    console.error('[log-usage] Error:', error);
    return NextResponse.json({ error: 'Failed to log usage' }, { status: 500 });
  }
}
