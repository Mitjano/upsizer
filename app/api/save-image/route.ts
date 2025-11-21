import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { originalFilename, originalPath, processedPath, fileSize, width, height, userId } = body;

    if (!originalFilename || !originalPath || !processedPath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify that the userId matches the authenticated user
    if (userId !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Save metadata to Firestore
    const docRef = await adminDb.collection('processedImages').add({
      originalFilename,
      originalPath,
      processedPath,
      fileSize,
      width,
      height,
      createdAt: new Date(),
      userId,
    });

    console.log('Metadata saved with ID:', docRef.id);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      originalPath,
      processedPath,
    });
  } catch (error: any) {
    console.error('Error saving metadata:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save metadata' },
      { status: 500 }
    );
  }
}
