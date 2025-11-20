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

    console.log('Processing background removal with BRIA RMBG 2.0...');

    // Convert file to Buffer (Replicate Node.js client supports Buffer directly)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run BRIA Remove Background Model
    const output = await replicate.run(
      "bria/remove-background",
      {
        input: {
          image: buffer
        }
      }
    ) as any;

    console.log('Background removal completed');
    console.log('Output type:', typeof output);
    console.log('Output:', JSON.stringify(output, null, 2));

    // Handle output
    let imageUrl: string;

    if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object' && 'output' in output) {
      imageUrl = output.output as string;
    } else if (Array.isArray(output) && output.length > 0) {
      imageUrl = output[0];
    } else {
      console.error('Unexpected output format. Output:', output);
      throw new Error(`Unexpected output format from Replicate API: ${JSON.stringify(output)}`);
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
