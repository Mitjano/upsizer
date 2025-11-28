import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail } from '@/lib/db';
import { getGeneratedImageById, toggleLike } from '@/lib/ai-image/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { id } = await params;

    const image = getGeneratedImageById(id);
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Only allow liking public images
    if (!image.isPublic) {
      return NextResponse.json(
        { error: 'Cannot like private images' },
        { status: 400 }
      );
    }

    const result = toggleLike(id, user.id);
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to toggle like' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      liked: result.liked,
      likes: result.likes,
    });
  } catch (error) {
    console.error('Like toggle error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
