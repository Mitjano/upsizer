/**
 * AI Music Generation Module
 *
 * Obsługuje generowanie muzyki przez Fal.ai (MiniMax Music 2.0)
 */

import {
  MusicModelId,
  MusicProvider,
  MusicStyle,
  MusicMood,
  MusicDuration,
  getModelConfig,
} from './models';

export interface MusicGenerationInput {
  prompt: string;
  lyrics?: string;
  style?: MusicStyle;
  mood?: MusicMood;
  duration: MusicDuration;
  instrumental?: boolean;
  bpm?: number;
  key?: string;
  model: MusicModelId;
  referenceTrackUrl?: string;
}

export interface MusicGenerationResult {
  success: boolean;
  jobId?: string;
  provider: MusicProvider;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  error?: string;
  estimatedTime?: number;
}

/**
 * Build the prompt for MiniMax Music based on input parameters
 */
function buildMusicPrompt(input: MusicGenerationInput): string {
  const parts: string[] = [];

  // Add style and mood
  if (input.style) {
    parts.push(input.style);
  }
  if (input.mood) {
    parts.push(input.mood);
  }

  // Add user prompt
  parts.push(input.prompt);

  // Add BPM if specified
  if (input.bpm) {
    parts.push(`${input.bpm} BPM`);
  }

  // Add key if specified
  if (input.key) {
    parts.push(`in ${input.key}`);
  }

  // Add instrumental flag
  if (input.instrumental) {
    parts.push('instrumental, no vocals');
  }

  return parts.join(', ');
}

/**
 * Generate music via Fal.ai (MiniMax Music 2.0)
 */
async function generateViaFal(
  input: MusicGenerationInput
): Promise<MusicGenerationResult> {
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
    const prompt = buildMusicPrompt(input);

    // MiniMax Music 2.0 API request body
    const requestBody: Record<string, unknown> = {
      prompt,
      // Duration in seconds
      duration: input.duration,
    };

    // Add lyrics if provided (with song structure tags)
    if (input.lyrics && !input.instrumental) {
      requestBody.lyrics = input.lyrics;
    }

    // Add reference track if provided
    if (input.referenceTrackUrl) {
      requestBody.reference_audio_url = input.referenceTrackUrl;
    }

    const endpoint = 'https://queue.fal.run/fal-ai/minimax-music';

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
    console.error('Fal.ai music generation error:', error);
    return {
      success: false,
      provider: 'fal',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main music generation function
 */
export async function generateMusic(
  input: MusicGenerationInput
): Promise<MusicGenerationResult> {
  const modelConfig = getModelConfig(input.model);

  if (!modelConfig) {
    return {
      success: false,
      provider: 'fal',
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

  // Validate duration
  if (!modelConfig.durations.includes(input.duration)) {
    return {
      success: false,
      provider: modelConfig.provider,
      status: 'failed',
      error: `Duration ${input.duration}s not supported for ${input.model}`,
    };
  }

  // Select provider
  switch (modelConfig.provider) {
    case 'fal':
      return generateViaFal(input);
    default:
      return {
        success: false,
        provider: 'fal',
        status: 'failed',
        error: `Unknown provider: ${modelConfig.provider}`,
      };
  }
}

/**
 * Check music generation status
 */
export async function checkMusicGenerationStatus(
  jobId: string,
  provider: MusicProvider = 'fal'
): Promise<MusicGenerationResult> {
  if (provider === 'fal') {
    return checkFalMusicStatus(jobId);
  }

  return {
    success: false,
    provider,
    status: 'failed',
    error: `Unknown provider: ${provider}`,
  };
}

async function checkFalMusicStatus(jobId: string): Promise<MusicGenerationResult> {
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
    const modelEndpoint = 'fal-ai/minimax-music';

    const response = await fetch(`https://queue.fal.run/${modelEndpoint}/requests/${jobId}/status`, {
      headers: {
        'Authorization': `Key ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fal.ai music status check failed:', response.status, errorText);
      throw new Error(`Failed to check Fal.ai status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'COMPLETED') {
      // Fetch the result
      const resultResponse = await fetch(`https://queue.fal.run/${modelEndpoint}/requests/${jobId}`, {
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
        audioUrl: result.audio?.url || result.audio_url,
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
 * Cancel music generation (if supported)
 */
export async function cancelMusicGeneration(
  jobId: string,
  provider: MusicProvider = 'fal'
): Promise<boolean> {
  try {
    if (provider === 'fal') {
      const apiKey = process.env.FAL_API_KEY;
      if (!apiKey) return false;

      await fetch(`https://queue.fal.run/fal-ai/minimax-music/requests/${jobId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Key ${apiKey}` },
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Cancel music generation error:', error);
    return false;
  }
}
