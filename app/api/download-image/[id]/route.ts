import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb, adminStorage } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: imageId } = await params;
    const userEmail = session.user.email;

    // Fetch image metadata from Firestore
    const imageDoc = await adminDb.collection('processedImages').doc(imageId).get();

    if (!imageDoc.exists) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageData = imageDoc.data();

    // Verify user owns this image
    if (imageData?.userId !== userEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Download processed image from Replicate URL (no Firebase Storage)
    const replicateUrl = imageData.processedPath;

    if (!replicateUrl) {
      return NextResponse.json({ error: 'Image URL not found' }, { status: 404 });
    }

    // Fetch image from Replicate CDN
    const imageResponse = await fetch(replicateUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image from Replicate');
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Get original filename without extension
    const originalFilename = imageData.originalFilename || 'image';
    const baseFilename = originalFilename.split('.')[0];
    const downloadFilename = `${baseFilename}_processed.png`;

    return new Response(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error downloading image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to download image' },
      { status: 500 }
    );
  }
}
