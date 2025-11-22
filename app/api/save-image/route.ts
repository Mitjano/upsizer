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

    if (!originalFile || !processedFile) {
      return NextResponse.json({ error: 'Missing files' }, { status: 400 });
    }

    const userEmail = session.user.email;
    const timestamp = Date.now();

    // We only save the processed PNG file (already processed by Replicate)
    // No need to save the original file or convert WEBP - bgremover.pl doesn't save originals either
    const processedBuffer = Buffer.from(await processedFile.arrayBuffer());
    const processedFileName = `processed/${userEmail}/${timestamp}_processed.png`;
    const processedFileRef = adminStorage.bucket().file(processedFileName);

    await processedFileRef.save(processedBuffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          firebaseStorageDownloadTokens: `${timestamp}`,
        }
      },
      validation: false,
    });
    console.log('Processed uploaded:', processedFileName);

    // Save metadata to Firestore
    const docRef = await adminDb.collection('processedImages').add({
      originalFilename: originalFile.name,
      processedPath: processedFileName,
      fileSize: originalFile.size,
      createdAt: new Date(),
      userId: userEmail,
    });

    console.log('Metadata saved with ID:', docRef.id);

    return NextResponse.json({
      success: true,
      id: docRef.id,
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
