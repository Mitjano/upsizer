import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(bytes);

    // Check image dimensions and resize if needed (max 2048px to reduce token usage)
    const MAX_DIMENSION = 2048;
    try {
      const metadata = await sharp(buffer).metadata();
      const { width, height } = metadata;

      if (width && height && (width > MAX_DIMENSION || height > MAX_DIMENSION)) {
        // Resize keeping aspect ratio
        const resizedBuffer = await sharp(buffer)
          .resize(MAX_DIMENSION, MAX_DIMENSION, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        buffer = resizedBuffer;
      }
    } catch {
      // If sharp fails, continue with original buffer
      console.warn('[ai-agent/upload] Could not process image with sharp, using original');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'ai-agent');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename (use jpg if we resized, otherwise keep original extension)
    const ext = file.name.split('.').pop() || 'png';
    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Save the (possibly resized) buffer
    await writeFile(filepath, buffer);

    // Convert to base64 for AI model
    // Use image/jpeg if we resized, otherwise keep original type
    const mimeType = buffer.length !== bytes.byteLength ? 'image/jpeg' : file.type;
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Return public URL and base64 for AI
    const url = `/uploads/ai-agent/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      dataUrl, // base64 data URL for AI model
      filename: file.name,
      originalSize: file.size,
      processedSize: buffer.length,
      type: mimeType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
