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

    // Validate file type - NO WEBP to avoid Firebase decoder errors
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload JPG or PNG' }, { status: 400 });
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    console.log('Processing background removal with BRIA RMBG 2.0...');

    // Convert file to data URI (most reliable method per Replicate docs)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    // Determine MIME type - only JPG/PNG supported
    let mimeType = 'image/jpeg';
    if (file.type === 'image/png') {
      mimeType = 'image/png';
    }

    const dataURI = `data:${mimeType};base64,${base64}`;

    console.log('Image size:', buffer.length, 'bytes');
    console.log('MIME type:', mimeType);
    console.log('Data URI length:', dataURI.length);

    // Run BRIA Remove Background Model using predictions.create for better control
    console.log('Creating prediction...');
    const prediction = await replicate.predictions.create({
      version: "e62372ec9304f309dc216065f5c6823d477d16c1cd0f34609137d8eae79b5fd1",
      input: {
        image: dataURI
      }
    });

    console.log('Prediction created:', prediction.id);
    console.log('Prediction status:', prediction.status);
    console.log('Prediction:', JSON.stringify(prediction, null, 2));

    // Wait for prediction to complete
    let completedPrediction = prediction;
    while (completedPrediction.status !== 'succeeded' && completedPrediction.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      completedPrediction = await replicate.predictions.get(prediction.id);
      console.log('Prediction status:', completedPrediction.status);
    }

    if (completedPrediction.status === 'failed') {
      console.error('Prediction failed:', completedPrediction.error);
      throw new Error(`Background removal failed: ${completedPrediction.error}`);
    }

    console.log('Prediction completed successfully');
    console.log('Output type:', typeof completedPrediction.output);
    console.log('Output:', JSON.stringify(completedPrediction.output, null, 2));

    // Handle output
    let imageUrl: string;
    const output = completedPrediction.output;

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

    // Return both the image blob AND the Replicate URL in the response
    // Frontend needs the URL to save to Firestore (avoiding Firebase Storage decoder errors)
    return NextResponse.json({
      imageUrl: imageUrl,  // Replicate CDN URL
      imageData: Buffer.from(imageBuffer).toString('base64'),  // Base64 for immediate display
    });
  } catch (error: any) {
    console.error('Error removing background:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove background' },
      { status: 500 }
    );
  }
}
