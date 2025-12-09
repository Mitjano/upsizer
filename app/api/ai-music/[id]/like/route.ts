import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { likeMusic } from '@/lib/ai-music';

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

    // Get user
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

    // Get track to check if it's public
    const track = await prisma.generatedMusic.findUnique({
      where: { id },
      select: { id: true, isPublic: true, userId: true, likes: true, likedBy: true },
    });

    if (!track) {
      return NextResponse.json(
        { error: 'Track not found' },
        { status: 404 }
      );
    }

    // Only allow liking public tracks (or own tracks)
    if (!track.isPublic && track.userId !== user.id) {
      return NextResponse.json(
        { error: 'Track is not public' },
        { status: 403 }
      );
    }

    // Toggle like using existing function
    const updatedTrack = await likeMusic(id, user.id);

    if (!updatedTrack) {
      return NextResponse.json(
        { error: 'Failed to update like' },
        { status: 500 }
      );
    }

    const isLiked = updatedTrack.likedBy.includes(user.id);

    return NextResponse.json({
      success: true,
      isLiked,
      likes: updatedTrack.likes,
    });
  } catch (error) {
    console.error('Like track error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
