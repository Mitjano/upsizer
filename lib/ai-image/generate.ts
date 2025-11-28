/**
 * AI Image Generator - Replicate Integration
 * Handles image generation using various AI models
 */

import Replicate from 'replicate';
import { getModelById, getAspectRatioById, AIModel, AspectRatio } from './models';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export interface GenerateImageInput {
  prompt: string;
  model: string;
  aspectRatio: string;
  mode: 'text-to-image' | 'image-to-image';
  sourceImage?: string; // base64 or URL for image-to-image
  seed?: number;
  negativePrompt?: string;
}

export interface GenerateImageResult {
  success: boolean;
  outputUrl?: string;
  seed?: number;
  processingTime?: number;
  error?: string;
}

/**
 * Generate image using Flux Schnell (fastest, cheapest)
 */
async function generateWithFluxSchnell(
  prompt: string,
  aspectRatio: AspectRatio,
  seed?: number
): Promise<GenerateImageResult> {
  const startTime = Date.now();

  try {
    const output = await replicate.run('black-forest-labs/flux-schnell', {
      input: {
        prompt,
        aspect_ratio: aspectRatio.ratio,
        output_format: 'webp',
        output_quality: 90,
        go_fast: true,
        num_outputs: 1,
        ...(seed && { seed }),
      },
    });

    const outputUrl = Array.isArray(output) ? String(output[0]) : String(output);

    return {
      success: true,
      outputUrl,
      seed,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Flux Schnell generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

/**
 * Generate image using Flux 1.1 Pro
 */
async function generateWithFlux11Pro(
  prompt: string,
  aspectRatio: AspectRatio,
  seed?: number
): Promise<GenerateImageResult> {
  const startTime = Date.now();

  try {
    const output = await replicate.run('black-forest-labs/flux-1.1-pro', {
      input: {
        prompt,
        aspect_ratio: aspectRatio.ratio,
        output_format: 'webp',
        output_quality: 90,
        safety_tolerance: 2,
        prompt_upsampling: true,
        ...(seed && { seed }),
      },
    });

    const outputUrl = Array.isArray(output) ? String(output[0]) : String(output);

    return {
      success: true,
      outputUrl,
      seed,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Flux 1.1 Pro generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

/**
 * Generate image using Flux 1.1 Pro Ultra (4MP)
 */
async function generateWithFlux11ProUltra(
  prompt: string,
  aspectRatio: AspectRatio,
  seed?: number
): Promise<GenerateImageResult> {
  const startTime = Date.now();

  try {
    const output = await replicate.run('black-forest-labs/flux-1.1-pro-ultra', {
      input: {
        prompt,
        aspect_ratio: aspectRatio.ratio,
        output_format: 'webp',
        output_quality: 90,
        safety_tolerance: 2,
        raw: false,
        ...(seed && { seed }),
      },
    });

    const outputUrl = Array.isArray(output) ? String(output[0]) : String(output);

    return {
      success: true,
      outputUrl,
      seed,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Flux 1.1 Pro Ultra generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

/**
 * Generate image using Flux 2.0 Pro
 */
async function generateWithFlux20Pro(
  prompt: string,
  aspectRatio: AspectRatio,
  seed?: number
): Promise<GenerateImageResult> {
  const startTime = Date.now();

  try {
    const output = await replicate.run('black-forest-labs/flux-2-pro', {
      input: {
        prompt,
        aspect_ratio: aspectRatio.ratio,
        output_format: 'webp',
        output_quality: 90,
        safety_tolerance: 2,
        ...(seed && { seed }),
      },
    });

    const outputUrl = Array.isArray(output) ? String(output[0]) : String(output);

    return {
      success: true,
      outputUrl,
      seed,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Flux 2.0 Pro generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

/**
 * Edit image using Flux Kontext Pro
 */
async function editWithFluxKontextPro(
  prompt: string,
  sourceImage: string,
  aspectRatio: AspectRatio
): Promise<GenerateImageResult> {
  const startTime = Date.now();

  try {
    const output = await replicate.run('black-forest-labs/flux-kontext-pro', {
      input: {
        prompt,
        input_image: sourceImage,
        aspect_ratio: 'match_input_image',
        output_format: 'webp',
        output_quality: 90,
        safety_tolerance: 2,
      },
    });

    const outputUrl = Array.isArray(output) ? String(output[0]) : String(output);

    return {
      success: true,
      outputUrl,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Flux Kontext Pro generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

/**
 * Generate/Edit image using Nano Banana Pro (Google Gemini 3)
 */
async function generateWithNanoBananaPro(
  prompt: string,
  aspectRatio: AspectRatio,
  sourceImage?: string
): Promise<GenerateImageResult> {
  const startTime = Date.now();

  try {
    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: aspectRatio.ratio,
      resolution: '2K',
      output_format: 'png',
      safety_filter_level: 'block_medium_and_above',
    };

    // Add source image for image-to-image mode
    if (sourceImage) {
      input.image_1 = sourceImage;
    }

    const output = await replicate.run('google/nano-banana-pro', {
      input,
    });

    const outputUrl = Array.isArray(output) ? String(output[0]) : String(output);

    return {
      success: true,
      outputUrl,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('Nano Banana Pro generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

/**
 * Main generation function - routes to appropriate model
 */
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const model = getModelById(input.model);
  const aspectRatio = getAspectRatioById(input.aspectRatio);

  if (!model) {
    return { success: false, error: `Unknown model: ${input.model}` };
  }

  if (!aspectRatio) {
    return { success: false, error: `Unknown aspect ratio: ${input.aspectRatio}` };
  }

  // Validate mode support
  if (!model.modes.includes(input.mode)) {
    return { success: false, error: `Model ${model.name} does not support ${input.mode} mode` };
  }

  // For image-to-image, require source image
  if (input.mode === 'image-to-image' && !input.sourceImage) {
    return { success: false, error: 'Source image is required for image-to-image mode' };
  }

  // Route to appropriate generation function
  switch (input.model) {
    case 'flux-schnell':
      return generateWithFluxSchnell(input.prompt, aspectRatio, input.seed);

    case 'flux-1.1-pro':
      return generateWithFlux11Pro(input.prompt, aspectRatio, input.seed);

    case 'flux-1.1-pro-ultra':
      return generateWithFlux11ProUltra(input.prompt, aspectRatio, input.seed);

    case 'flux-2.0-pro':
      return generateWithFlux20Pro(input.prompt, aspectRatio, input.seed);

    case 'flux-kontext-pro':
      if (!input.sourceImage) {
        return { success: false, error: 'Source image is required for Flux Kontext Pro' };
      }
      return editWithFluxKontextPro(input.prompt, input.sourceImage, aspectRatio);

    case 'nano-banana-pro':
      return generateWithNanoBananaPro(input.prompt, aspectRatio, input.sourceImage);

    default:
      return { success: false, error: `Unsupported model: ${input.model}` };
  }
}

/**
 * Generate multiple images (batch)
 */
export async function generateMultipleImages(
  input: GenerateImageInput,
  count: number
): Promise<GenerateImageResult[]> {
  const results: GenerateImageResult[] = [];

  for (let i = 0; i < count; i++) {
    // Generate with different seeds for variety
    const seed = input.seed ? input.seed + i : undefined;
    const result = await generateImage({ ...input, seed });
    results.push(result);
  }

  return results;
}
