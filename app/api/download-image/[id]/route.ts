import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import sharp from 'sharp';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const resolution = searchParams.get('resolution') || 'medium'; // low, medium, high, original
    const format = searchParams.get('format') || 'png'; // png, jpg

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

    // Download processed image from Firebase Storage
    const processedPath = imageData.processedPath;
    const file = adminStorage.bucket().file(processedPath);

    const [fileBuffer] = await file.download();

    // Determine target size based on resolution
    let targetSize: number | null = null;
    switch (resolution) {
      case 'low':
        targetSize = 512;
        break;
      case 'medium':
        targetSize = 1024;
        break;
      case 'high':
        targetSize = 2048;
        break;
      case 'original':
        targetSize = null; // No resizing
        break;
      default:
        targetSize = 1024;
    }

    // Process image with sharp
    let processedImage = sharp(fileBuffer);

    // Resize if needed
    if (targetSize) {
      processedImage = processedImage.resize(targetSize, targetSize, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Convert format
    let outputBuffer: Buffer;
    let contentType: string;
    let extension: string;

    if (format === 'jpg') {
      outputBuffer = await processedImage
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // White background for JPG
        .jpeg({ quality: 90 })
        .toBuffer();
      contentType = 'image/jpeg';
      extension = 'jpg';
    } else {
      // Default to PNG
      outputBuffer = await processedImage.png().toBuffer();
      contentType = 'image/png';
      extension = 'png';
    }

    // Get original filename without extension
    const originalFilename = imageData.originalFilename || 'image';
    const baseFilename = originalFilename.split('.')[0];
    const downloadFilename = `${baseFilename}_processed.${extension}`;

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
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
