import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const originalFile = formData.get('originalFile') as File;
    const processedFile = formData.get('processedFile') as File;

    if (!originalFile || !processedFile) {
      return NextResponse.json({ error: 'Missing files' }, { status: 400 });
    }

    const userEmail = session.user.email;
    const timestamp = Date.now();

    // Convert processed file buffer and get metadata using sharp
    const processedBuffer = Buffer.from(await processedFile.arrayBuffer());
    const imageMetadata = await sharp(processedBuffer).metadata();
    const width = imageMetadata.width || 0;
    const height = imageMetadata.height || 0;

    // Upload original to Storage
    const originalFileName = `originals/${userEmail}/${timestamp}_${originalFile.name}`;
    const originalBuffer = Buffer.from(await originalFile.arrayBuffer());
    const originalFileRef = adminStorage.bucket().file(originalFileName);
    await originalFileRef.save(originalBuffer, {
      metadata: {
        contentType: originalFile.type,
      },
    });
    await originalFileRef.makePublic();
    console.log('Original uploaded:', originalFileName);

    // Upload processed to Storage
    const processedFileName = `processed/${userEmail}/${timestamp}_processed.png`;
    const processedFileRef = adminStorage.bucket().file(processedFileName);
    await processedFileRef.save(processedBuffer, {
      metadata: {
        contentType: 'image/png',
      },
    });
    await processedFileRef.makePublic();
    console.log('Processed uploaded:', processedFileName);

    // Save metadata to Firestore
    const docRef = await adminDb.collection('processedImages').add({
      originalFilename: originalFile.name,
      originalPath: originalFileName,
      processedPath: processedFileName,
      fileSize: originalFile.size,
      width,
      height,
      createdAt: new Date(),
      userId: userEmail,
    });

    console.log('Metadata saved with ID:', docRef.id);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      originalPath: originalFileName,
      processedPath: processedFileName,
    });
  } catch (error: any) {
    console.error('Error saving image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save image' },
      { status: 500 }
    );
  }
}
