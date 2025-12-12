import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getBlogThumbnailPath } from '@/lib/blog-thumbnails';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const thumbnailPath = getBlogThumbnailPath(slug);

    if (!thumbnailPath) {
      return NextResponse.json(
        { error: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    const imageBuffer = fs.readFileSync(thumbnailPath);

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Blog image serve error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
