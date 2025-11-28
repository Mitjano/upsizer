import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail, updateUser, createUsage } from '@/lib/db';
import { generateImage, generateMultipleImages } from '@/lib/ai-image/generate';
import { createGeneratedImage } from '@/lib/ai-image/db';
import {
  getModelById,
  getAspectRatioById,
  calculateCredits,
  IMAGE_COUNT_OPTIONS,
  type ImageCount,
} from '@/lib/ai-image/models';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      prompt,
      mode = 'text-to-image',
      model: modelId = 'flux-1.1-pro',
      aspectRatio: aspectRatioId = '1:1',
      numImages = 1,
      sourceImage,
      seed,
      isPublic = false,
    } = body;

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt must be less than 2000 characters' },
        { status: 400 }
      );
    }

    // Validate model
    const model = getModelById(modelId);
    if (!model) {
      return NextResponse.json(
        { error: 'Invalid model' },
        { status: 400 }
      );
    }

    // Validate mode
    if (!['text-to-image', 'image-to-image'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode' },
        { status: 400 }
      );
    }

    if (!model.modes.includes(mode)) {
      return NextResponse.json(
        { error: `Model ${model.name} does not support ${mode} mode` },
        { status: 400 }
      );
    }

    // Validate aspect ratio
    const aspectRatio = getAspectRatioById(aspectRatioId);
    if (!aspectRatio) {
      return NextResponse.json(
        { error: 'Invalid aspect ratio' },
        { status: 400 }
      );
    }

    // Validate numImages
    if (!IMAGE_COUNT_OPTIONS.includes(numImages as ImageCount)) {
      return NextResponse.json(
        { error: 'Invalid number of images (must be 1, 2, 3, or 4)' },
        { status: 400 }
      );
    }

    // Validate source image for image-to-image
    if (mode === 'image-to-image' && !sourceImage) {
      return NextResponse.json(
        { error: 'Source image is required for image-to-image mode' },
        { status: 400 }
      );
    }

    // Calculate credits
    const creditsRequired = calculateCredits(modelId, numImages);

    // Check if user has enough credits
    if (user.credits < creditsRequired) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditsRequired,
          available: user.credits,
        },
        { status: 402 }
      );
    }

    // Generate images
    const generateInput = {
      prompt: prompt.trim(),
      model: modelId,
      aspectRatio: aspectRatioId,
      mode: mode as 'text-to-image' | 'image-to-image',
      sourceImage,
      seed,
    };

    let results;
    if (numImages === 1) {
      const result = await generateImage(generateInput);
      results = [result];
    } else {
      results = await generateMultipleImages(generateInput, numImages);
    }

    // Check for any failures
    const successfulResults = results.filter(r => r.success);
    const failedCount = results.length - successfulResults.length;

    if (successfulResults.length === 0) {
      return NextResponse.json(
        { error: 'All image generations failed', details: results[0]?.error },
        { status: 500 }
      );
    }

    // Calculate actual credits used (only for successful generations)
    const creditsPerImage = model.credits;
    const actualCreditsUsed = creditsPerImage * successfulResults.length;

    // Deduct credits
    updateUser(user.id, {
      credits: user.credits - actualCreditsUsed,
    });

    // Create usage record
    createUsage({
      userId: user.id,
      type: 'ai_image_generation',
      creditsUsed: actualCreditsUsed,
      model: modelId,
    });

    // Save generated images to database
    const savedImages = [];
    for (const result of successfulResults) {
      if (result.outputUrl) {
        const savedImage = createGeneratedImage({
          userId: user.id,
          userEmail: session.user.email,
          userName: session.user.name || undefined,
          userImage: session.user.image || undefined,
          prompt: prompt.trim(),
          model: modelId,
          mode: mode as 'text-to-image' | 'image-to-image',
          aspectRatio: aspectRatioId,
          width: aspectRatio.width,
          height: aspectRatio.height,
          seed: result.seed,
          sourceImageUrl: sourceImage,
          outputUrl: result.outputUrl,
          creditsUsed: creditsPerImage,
          processingTime: result.processingTime,
          isPublic,
        });
        savedImages.push(savedImage);
      }
    }

    return NextResponse.json({
      success: true,
      images: savedImages.map(img => ({
        id: img.id,
        url: img.outputUrl,
        thumbnailUrl: img.thumbnailUrl,
      })),
      creditsUsed: actualCreditsUsed,
      creditsRemaining: user.credits - actualCreditsUsed,
      ...(failedCount > 0 && { failedCount }),
    });
  } catch (error) {
    console.error('AI Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
