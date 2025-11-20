import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload JPG, PNG, or WebP' }, { status: 400 });
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    // Convert to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64Image}`;

    console.log('Processing background removal with BRIA RMBG 2.0...');

    // Run BRIA Remove Background Model
    const output = await replicate.run(
      "bria/remove-background:e62372ec9304f309dc216065f5c6823d477d16c1cd0f34609137d8eae79b5fd1",
      {
        input: {
          image: dataUri
        }
      }
    ) as any;

    console.log('Background removal completed');

    // Handle output
    let imageUrl: string;

    if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object' && 'output' in output) {
      imageUrl = output.output as string;
    } else if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    } else {
      throw new Error('Unexpected output format from Replicate API');
    }

    // Fetch the processed image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch processed image');
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    return new NextResponse(Buffer.from(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="removed-background.png"',
      },
    });
  } catch (error: any) {
    console.error('Error removing background:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove background' },
      { status: 500 }
    );
  }
}
