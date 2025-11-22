import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = session.user.email;

    // Fetch images from Firestore for this user
    const imagesSnapshot = await adminDb
      .collection('processedImages')
      .where('userId', '==', userEmail)
      .orderBy('createdAt', 'desc')
      .get();

    const images = imagesSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          originalFilename: data.originalFilename,
          originalPath: data.originalPath,
          processedPath: data.processedPath,
          fileSize: data.fileSize,
          width: data.width,
          height: data.height,
          createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
        };
      })
      // Filter out WEBP files to avoid decoder errors
      .filter(image => {
        const isWebp = image.originalPath?.includes('.webp') || image.processedPath?.includes('.webp');
        if (isWebp) {
          console.log(`Skipping WEBP file: ${image.originalFilename}`);
        }
        return !isWebp;
      });

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch images' },
      { status: 500 }
    );
  }
}
