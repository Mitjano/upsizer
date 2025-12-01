import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail } from '@/lib/db';
import { getGeneratedImageById, togglePublic } from '@/lib/ai-image/db';

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

    const user = await getUserByEmail(session.user.email);
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

    // Verify ownership
    if (image.userId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this image' },
        { status: 403 }
      );
    }

    const isPublic = togglePublic(id, user.id);
    if (isPublic === null) {
      return NextResponse.json(
        { error: 'Failed to toggle publish status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isPublic,
      message: isPublic ? 'Image published to gallery' : 'Image hidden from gallery',
    });
  } catch (error) {
    console.error('Publish toggle error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle publish status' },
      { status: 500 }
    );
  }
}
