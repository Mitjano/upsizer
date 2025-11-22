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
    const { originalFilename, replicateUrl, fileSize } = body;

    if (!originalFilename || !replicateUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userEmail = session.user.email;

    // bgremover.pl approach: Store the Replicate CDN URL directly in Firestore
    // No Firebase Storage upload = no decoder errors
    // The Replicate URL is temporary but works for the session
    const docRef = await adminDb.collection('processedImages').add({
      originalFilename,
      processedPath: replicateUrl, // Store Replicate URL directly - no Firebase Storage
      fileSize: fileSize || 0,
      createdAt: new Date(),
      userId: userEmail,
    });

    console.log('Image metadata saved with ID:', docRef.id, 'URL:', replicateUrl);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      processedPath: replicateUrl,
    });
  } catch (error: any) {
    console.error('Error saving image metadata:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save image' },
      { status: 500 }
    );
  }
}
