/**
 * AI Video Generation Module
 *
 * Obsługuje generowanie wideo przez różnych dostawców:
 * - Replicate (PixVerse, Veo)
 * - PiAPI (Kling)
 * - Runway (Gen-4)
 */

import Replicate from 'replicate';
import {
  VideoModelId,
  VideoProvider,
  AspectRatio,
  Resolution,
  Duration,
  getModelConfig,
  VIDEO_MODELS,
} from './models';

export interface VideoGenerationInput {
  prompt: string;
  negativePrompt?: string;
  model: VideoModelId;
  duration: Duration;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  fps?: number;
  seed?: number;
  sourceImageUrl?: string;
  webhookUrl?: string;
}

export interface VideoGenerationResult {
  success: boolean;
  jobId?: string;
  provider: VideoProvider;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  estimatedTime?: number;
}

/**
 * Inicjalizuj klienta Replicate
 */
function getReplicateClient(): Replicate {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }
  return new Replicate({ auth: apiToken });
}

/**
 * Generuj wideo przez Replicate
 */
async function generateViaReplicate(
  input: VideoGenerationInput
): Promise<VideoGenerationResult> {
  const replicate = getReplicateClient();
  const modelConfig = getModelConfig(input.model);

  if (!modelConfig || modelConfig.provider !== 'replicate') {
    return {
      success: false,
      provider: 'replicate',
      status: 'failed',
      error: 'Invalid model for Replicate provider',
    };
  }

  try {
    // Mapuj parametry na format Replicate
    const replicateInput: Record<string, unknown> = {
      prompt: input.prompt,
      duration: input.duration,
      aspect_ratio: input.aspectRatio,
    };

    if (input.negativePrompt) {
      replicateInput.negative_prompt = input.negativePrompt;
    }

    if (input.seed) {
      replicateInput.seed = input.seed;
    }

    if (input.sourceImageUrl) {
      replicateInput.image = input.sourceImageUrl;
    }

    // Dla PixVerse V5
    if (input.model === 'pixverse-v5') {
      replicateInput.resolution = input.resolution === '1080p' ? 'high' : 'medium';
    }

    // Dla Veo 3.1
    if (input.model === 'veo-3.1') {
      replicateInput.generate_audio = true;
    }

    // Uruchom predykcję z webhookiem lub synchronicznie
    const prediction = await replicate.predictions.create({
      model: modelConfig.modelIdentifier as `${string}/${string}`,
      input: replicateInput,
      webhook: input.webhookUrl,
      webhook_events_filter: ['completed'],
    });

    return {
      success: true,
      jobId: prediction.id,
      provider: 'replicate',
      status: 'processing',
      estimatedTime: modelConfig.estimatedProcessingTime.max,
    };
  } catch (error) {
    console.error('Replicate generation error:', error);
    return {
      success: false,
      provider: 'replicate',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generuj wideo przez PiAPI (Kling)
 */
async function generateViaPiAPI(
  input: VideoGenerationInput
): Promise<VideoGenerationResult> {
  const apiKey = process.env.PIAPI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      provider: 'piapi',
      status: 'failed',
      error: 'PIAPI_API_KEY is not configured',
    };
  }

  const modelConfig = getModelConfig(input.model);
  if (!modelConfig || modelConfig.provider !== 'piapi') {
    return {
      success: false,
      provider: 'piapi',
      status: 'failed',
      error: 'Invalid model for PiAPI provider',
    };
  }

  try {
    const response = await fetch('https://api.piapi.ai/api/v1/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        model: modelConfig.modelIdentifier,
        task_type: input.sourceImageUrl ? 'image2video' : 'text2video',
        input: {
          prompt: input.prompt,
          negative_prompt: input.negativePrompt || '',
          duration: input.duration,
          aspect_ratio: input.aspectRatio,
          mode: input.resolution === '1080p' ? 'pro' : 'standard',
          ...(input.sourceImageUrl && { image_url: input.sourceImageUrl }),
        },
        config: {
          webhook_url: input.webhookUrl,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'PiAPI request failed');
    }

    const data = await response.json();

    return {
      success: true,
      jobId: data.data.task_id,
      provider: 'piapi',
      status: 'processing',
      estimatedTime: modelConfig.estimatedProcessingTime.max,
    };
  } catch (error) {
    console.error('PiAPI generation error:', error);
    return {
      success: false,
      provider: 'piapi',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generuj wideo przez Fal.ai (Hailuo, Luma)
 */
async function generateViaFal(
  input: VideoGenerationInput
): Promise<VideoGenerationResult> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      provider: 'fal',
      status: 'failed',
      error: 'FAL_API_KEY is not configured',
    };
  }

  const modelConfig = getModelConfig(input.model);
  if (!modelConfig || modelConfig.provider !== 'fal') {
    return {
      success: false,
      provider: 'fal',
      status: 'failed',
      error: 'Invalid model for Fal provider',
    };
  }

  try {
    // Fal.ai uses different endpoints based on model
    let endpoint: string;
    let requestBody: Record<string, unknown>;

    if (input.model.startsWith('hailuo')) {
      // MiniMax Hailuo
      endpoint = 'https://queue.fal.run/fal-ai/minimax-video';
      requestBody = {
        prompt: input.prompt,
        prompt_optimizer: true,
      };
      if (input.sourceImageUrl) {
        requestBody.first_frame_image = input.sourceImageUrl;
      }
    } else if (input.model === 'luma-ray2-flash') {
      // Luma Dream Machine
      endpoint = 'https://queue.fal.run/fal-ai/luma-dream-machine';
      requestBody = {
        prompt: input.prompt,
        aspect_ratio: input.aspectRatio,
      };
      if (input.sourceImageUrl) {
        requestBody.image_url = input.sourceImageUrl;
      }
    } else {
      return {
        success: false,
        provider: 'fal',
        status: 'failed',
        error: `Unknown Fal model: ${input.model}`,
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Fal.ai request failed');
    }

    const data = await response.json();

    return {
      success: true,
      jobId: data.request_id,
      provider: 'fal',
      status: 'processing',
      estimatedTime: modelConfig.estimatedProcessingTime.max,
    };
  } catch (error) {
    console.error('Fal.ai generation error:', error);
    return {
      success: false,
      provider: 'fal',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generuj wideo przez Runway
 */
async function generateViaRunway(
  input: VideoGenerationInput
): Promise<VideoGenerationResult> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      provider: 'runway',
      status: 'failed',
      error: 'RUNWAY_API_KEY is not configured',
    };
  }

  const modelConfig = getModelConfig(input.model);
  if (!modelConfig || modelConfig.provider !== 'runway') {
    return {
      success: false,
      provider: 'runway',
      status: 'failed',
      error: 'Invalid model for Runway provider',
    };
  }

  try {
    const response = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: modelConfig.modelIdentifier,
        promptText: input.prompt,
        duration: input.duration,
        ratio: input.aspectRatio.replace(':', '_'),
        watermark: false,
        ...(input.sourceImageUrl && { promptImage: input.sourceImageUrl }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Runway request failed');
    }

    const data = await response.json();

    return {
      success: true,
      jobId: data.id,
      provider: 'runway',
      status: 'processing',
      estimatedTime: modelConfig.estimatedProcessingTime.max,
    };
  } catch (error) {
    console.error('Runway generation error:', error);
    return {
      success: false,
      provider: 'runway',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Główna funkcja generowania wideo
 * Automatycznie wybiera odpowiedniego dostawcę na podstawie modelu
 */
export async function generateVideo(
  input: VideoGenerationInput
): Promise<VideoGenerationResult> {
  const modelConfig = getModelConfig(input.model);

  if (!modelConfig) {
    return {
      success: false,
      provider: 'replicate',
      status: 'failed',
      error: `Unknown model: ${input.model}`,
    };
  }

  if (!modelConfig.isActive) {
    return {
      success: false,
      provider: modelConfig.provider,
      status: 'failed',
      error: `Model ${input.model} is not currently active`,
    };
  }

  // Walidacja czasu trwania
  if (!modelConfig.durations.includes(input.duration)) {
    return {
      success: false,
      provider: modelConfig.provider,
      status: 'failed',
      error: `Duration ${input.duration}s not supported for ${input.model}`,
    };
  }

  // Walidacja proporcji
  if (!modelConfig.aspectRatios.includes(input.aspectRatio)) {
    return {
      success: false,
      provider: modelConfig.provider,
      status: 'failed',
      error: `Aspect ratio ${input.aspectRatio} not supported for ${input.model}`,
    };
  }

  // Wybierz dostawcę
  switch (modelConfig.provider) {
    case 'replicate':
      return generateViaReplicate(input);
    case 'piapi':
      return generateViaPiAPI(input);
    case 'runway':
      return generateViaRunway(input);
    case 'fal':
      return generateViaFal(input);
    default:
      return {
        success: false,
        provider: 'replicate',
        status: 'failed',
        error: `Unknown provider: ${modelConfig.provider}`,
      };
  }
}

/**
 * Sprawdź status generacji
 */
export async function checkGenerationStatus(
  jobId: string,
  provider: VideoProvider
): Promise<VideoGenerationResult> {
  switch (provider) {
    case 'replicate':
      return checkReplicateStatus(jobId);
    case 'piapi':
      return checkPiAPIStatus(jobId);
    case 'runway':
      return checkRunwayStatus(jobId);
    case 'fal':
      return checkFalStatus(jobId);
    default:
      return {
        success: false,
        provider,
        status: 'failed',
        error: `Unknown provider: ${provider}`,
      };
  }
}

async function checkReplicateStatus(jobId: string): Promise<VideoGenerationResult> {
  try {
    const replicate = getReplicateClient();
    const prediction = await replicate.predictions.get(jobId);

    if (prediction.status === 'succeeded') {
      const output = prediction.output as string | string[];
      const videoUrl = Array.isArray(output) ? output[0] : output;

      return {
        success: true,
        jobId,
        provider: 'replicate',
        status: 'completed',
        videoUrl,
      };
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      return {
        success: false,
        jobId,
        provider: 'replicate',
        status: 'failed',
        error: typeof prediction.error === 'string' ? prediction.error : 'Generation failed',
      };
    }

    return {
      success: true,
      jobId,
      provider: 'replicate',
      status: 'processing',
    };
  } catch (error) {
    return {
      success: false,
      jobId,
      provider: 'replicate',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkPiAPIStatus(jobId: string): Promise<VideoGenerationResult> {
  const apiKey = process.env.PIAPI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      provider: 'piapi',
      status: 'failed',
      error: 'PIAPI_API_KEY is not configured',
    };
  }

  try {
    const response = await fetch(`https://api.piapi.ai/api/v1/task/${jobId}`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check PiAPI status');
    }

    const data = await response.json();
    const status = data.data.status;

    if (status === 'completed') {
      return {
        success: true,
        jobId,
        provider: 'piapi',
        status: 'completed',
        videoUrl: data.data.output.video_url,
        thumbnailUrl: data.data.output.thumbnail_url,
      };
    }

    if (status === 'failed') {
      return {
        success: false,
        jobId,
        provider: 'piapi',
        status: 'failed',
        error: data.data.error || 'Generation failed',
      };
    }

    return {
      success: true,
      jobId,
      provider: 'piapi',
      status: 'processing',
    };
  } catch (error) {
    return {
      success: false,
      jobId,
      provider: 'piapi',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkRunwayStatus(jobId: string): Promise<VideoGenerationResult> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      provider: 'runway',
      status: 'failed',
      error: 'RUNWAY_API_KEY is not configured',
    };
  }

  try {
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check Runway status');
    }

    const data = await response.json();

    if (data.status === 'SUCCEEDED') {
      return {
        success: true,
        jobId,
        provider: 'runway',
        status: 'completed',
        videoUrl: data.output[0],
      };
    }

    if (data.status === 'FAILED') {
      return {
        success: false,
        jobId,
        provider: 'runway',
        status: 'failed',
        error: data.failure || 'Generation failed',
      };
    }

    return {
      success: true,
      jobId,
      provider: 'runway',
      status: 'processing',
    };
  } catch (error) {
    return {
      success: false,
      jobId,
      provider: 'runway',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkFalStatus(jobId: string): Promise<VideoGenerationResult> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      provider: 'fal',
      status: 'failed',
      error: 'FAL_API_KEY is not configured',
    };
  }

  try {
    const response = await fetch(`https://queue.fal.run/fal-ai/requests/${jobId}/status`, {
      headers: {
        'Authorization': `Key ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check Fal.ai status');
    }

    const data = await response.json();

    if (data.status === 'COMPLETED') {
      // Fetch the result
      const resultResponse = await fetch(`https://queue.fal.run/fal-ai/requests/${jobId}`, {
        headers: {
          'Authorization': `Key ${apiKey}`,
        },
      });
      const result = await resultResponse.json();

      return {
        success: true,
        jobId,
        provider: 'fal',
        status: 'completed',
        videoUrl: result.video?.url || result.output?.video_url,
      };
    }

    if (data.status === 'FAILED') {
      return {
        success: false,
        jobId,
        provider: 'fal',
        status: 'failed',
        error: data.error || 'Generation failed',
      };
    }

    return {
      success: true,
      jobId,
      provider: 'fal',
      status: 'processing',
    };
  } catch (error) {
    return {
      success: false,
      jobId,
      provider: 'fal',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Anuluj generację (jeśli obsługiwane)
 */
export async function cancelGeneration(
  jobId: string,
  provider: VideoProvider
): Promise<boolean> {
  try {
    switch (provider) {
      case 'replicate': {
        const replicate = getReplicateClient();
        await replicate.predictions.cancel(jobId);
        return true;
      }
      case 'piapi': {
        const apiKey = process.env.PIAPI_API_KEY;
        if (!apiKey) return false;
        await fetch(`https://api.piapi.ai/api/v1/task/${jobId}/cancel`, {
          method: 'POST',
          headers: { 'X-API-Key': apiKey },
        });
        return true;
      }
      case 'runway':
        // Runway doesn't support cancellation via API
        return false;
      case 'fal': {
        const apiKey = process.env.FAL_API_KEY;
        if (!apiKey) return false;
        await fetch(`https://queue.fal.run/fal-ai/requests/${jobId}/cancel`, {
          method: 'PUT',
          headers: { 'Authorization': `Key ${apiKey}` },
        });
        return true;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error('Cancel generation error:', error);
    return false;
  }
}
