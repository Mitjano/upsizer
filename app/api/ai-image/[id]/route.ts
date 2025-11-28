import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail } from '@/lib/db';
import {
  getGeneratedImageById,
  deleteGeneratedImage,
  incrementViews,
} from '@/lib/ai-image/db';

// GET - Get image details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const image = getGeneratedImageById(id);
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Check if image is public or if user is the owner
    const session = await auth();
    const isOwner = session?.user?.email === image.userEmail;

    if (!image.isPublic && !isOwner) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Increment views (only for public images viewed by non-owners)
    if (image.isPublic && !isOwner) {
      incrementViews(id);
    }

    // Check if current user has liked this image
    let hasLiked = false;
    if (session?.user?.email) {
      const user = getUserByEmail(session.user.email);
      if (user) {
        hasLiked = image.likedBy?.includes(user.id) || false;
      }
    }

    return NextResponse.json({
      id: image.id,
      prompt: image.prompt,
      negativePrompt: image.negativePrompt,
      model: image.model,
      mode: image.mode,
      aspectRatio: image.aspectRatio,
      width: image.width,
      height: image.height,
      seed: image.seed,
      outputUrl: image.outputUrl,
      thumbnailUrl: image.thumbnailUrl,
      sourceImageUrl: isOwner ? image.sourceImageUrl : undefined,
      isPublic: image.isPublic,
      likes: image.likes,
      views: image.views + (image.isPublic && !isOwner ? 1 : 0),
      hasLiked,
      createdAt: image.createdAt,
      user: {
        name: image.userName || 'Anonymous',
        image: image.userImage,
      },
      isOwner,
    });
  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json(
      { error: 'Failed to get image' },
      { status: 500 }
    );
  }
}

// DELETE - Delete image (owner only)
export async function DELETE(
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

    const { id } = await params;

    const image = getGeneratedImageById(id);
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (image.userEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'Not authorized to delete this image' },
        { status: 403 }
      );
    }

    const deleted = deleteGeneratedImage(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
