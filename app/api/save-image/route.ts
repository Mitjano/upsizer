import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb, adminStorage } from '@/lib/firebase-admin';

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
    const width = parseInt(formData.get('width') as string);
    const height = parseInt(formData.get('height') as string);

    if (!originalFile || !processedFile) {
      return NextResponse.json({ error: 'Missing files' }, { status: 400 });
    }

    const userEmail = session.user.email;
    const timestamp = Date.now();

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
    const processedBuffer = Buffer.from(await processedFile.arrayBuffer());
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
