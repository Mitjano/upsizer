import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { setMusicPublic } from '@/lib/ai-music';

// POST - Toggle track visibility (public/private)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const music = await prisma.generatedMusic.findUnique({
      where: { id },
      select: { userId: true, isPublic: true },
    });

    if (!music || music.userId !== user.id) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { isPublic } = body;

    // Update visibility
    const updated = await setMusicPublic(id, isPublic);

    return NextResponse.json({
      success: true,
      isPublic: updated.isPublic,
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
