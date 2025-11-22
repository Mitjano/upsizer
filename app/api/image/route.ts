import { NextRequest, NextResponse } from 'next/server';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
    }

    // Path is now a full Replicate URL (no Firebase Storage lookup needed)
    // Just proxy it through our API to avoid CORS issues
    const imageResponse = await fetch(path);

    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image from Replicate');
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/png';

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error proxying image:', error);
    return NextResponse.json(
      { error: 'Failed to load image', details: error.message },
      { status: 500 }
    );
  }
}
