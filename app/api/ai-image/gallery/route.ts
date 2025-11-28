import { NextRequest, NextResponse } from 'next/server';
import { getPublicGalleryImages } from '@/lib/ai-image/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const model = searchParams.get('model') || undefined;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const { images, total, hasMore } = getPublicGalleryImages({
      page,
      limit,
      model,
    });

    return NextResponse.json({
      images: images.map(img => ({
        id: img.id,
        thumbnailUrl: img.thumbnailUrl || img.outputUrl,
        outputUrl: img.outputUrl,
        prompt: img.prompt,
        model: img.model,
        aspectRatio: img.aspectRatio,
        width: img.width,
        height: img.height,
        user: {
          name: img.userName || 'Anonymous',
          image: img.userImage,
        },
        likes: img.likes,
        views: img.views,
        createdAt: img.createdAt,
      })),
      hasMore,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Gallery fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gallery' },
      { status: 500 }
    );
  }
}
