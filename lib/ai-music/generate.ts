/**
 * AI Music Generation Module
 *
 * Obsługuje generowanie muzyki przez:
 * - Suno AI (via GoAPI) - Główny provider, najlepsza jakość, do 4-8 min
 * - Fal.ai (MiniMax Music v2) - Fallback, do 4 min
 * - PiAPI (Udio) - Alternatywa (obecnie problemy z backendem)
 */

import {
  generateMusicSuno,
  checkSunoStatus,
  cancelSunoGeneration,
} from './suno-provider';

import {
  generateMusicPiAPI,
  checkPiAPIStatus,
  cancelPiAPIGeneration,
} from './piapi-provider';

export type MusicProviderType = 'suno' | 'fal' | 'piapi';

export interface MusicGenerationInput {
  prompt: string;        // Tekst piosenki / lyrics (dla custom) lub opis (dla simple)
  stylePrompt: string;   // Style of music description
  instrumental?: boolean;
  title?: string;
  mode?: 'simple' | 'custom';
  provider?: MusicProviderType;  // 'suno' (default) or 'fal' (MiniMax)
}

export interface MusicGenerationResult {
  success: boolean;
  jobId?: string;
  provider: MusicProviderType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  audioUrls?: string[];  // Suno generates multiple clips
  error?: string;
  estimatedTime?: number;
}

/**
 * Main function to generate music - routes to appropriate provider
 */
export async function generateMusic(
  input: MusicGenerationInput
): Promise<MusicGenerationResult> {
  // Provider priority: Suno/GoAPI > Fal.ai (MiniMax v2) > PiAPI
  // Suno is the default - best quality, up to 4-8 min songs
  const provider = input.provider ||
    (process.env.GOAPI_API_KEY ? 'suno' :    // Suno as primary (best quality, long songs)
     process.env.FAL_API_KEY ? 'fal' :        // MiniMax v2 as fallback
     'suno');                                 // Default to suno

  if (provider === 'suno') {
    return generateMusicViaSuno(input);
  }
  if (provider === 'piapi') {
    return generateMusicViaPiAPI(input);
  }
  return generateMusicViaFal(input);
}

/**
 * Generate music via Suno (GoAPI)
 */
async function generateMusicViaSuno(
  input: MusicGenerationInput
): Promise<MusicGenerationResult> {
  const result = await generateMusicSuno({
    prompt: input.prompt,
    stylePrompt: input.stylePrompt,
    title: input.title,
    instrumental: input.instrumental,
    mode: input.mode,
  });

  return {
    success: result.success,
    jobId: result.taskId,
    provider: 'suno',
    status: result.status,
    audioUrls: result.audioUrls,
    error: result.error,
    estimatedTime: result.estimatedTime,
  };
}

/**
 * Generate music via PiAPI (Udio model)
 */
async function generateMusicViaPiAPI(
  input: MusicGenerationInput
): Promise<MusicGenerationResult> {
  const result = await generateMusicPiAPI({
    prompt: input.prompt,
    stylePrompt: input.stylePrompt,
    title: input.title,
    instrumental: input.instrumental,
  });

  return {
    success: result.success,
    jobId: result.taskId,
    provider: 'piapi',
    status: result.status,
    audioUrls: result.audioUrls,
    error: result.error,
    estimatedTime: result.estimatedTime,
  };
}

/**
 * Generate music via Fal.ai (MiniMax Music v1.5)
 * Note: We use v1.5 because it doesn't require reference_audio_url
 */
async function generateMusicViaFal(
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

  try {
    // MiniMax Music v1.5 API parameters:
    // - prompt: Lyrics with structure tags (10-600 chars)
    // - lyrics_prompt: Style/mood description (10-3000 chars)

    // Prepare prompt (lyrics/song content)
    let promptContent = input.prompt;

    // If instrumental, add marker
    if (input.instrumental) {
      promptContent = `[Instrumental]\n${promptContent}`;
    }

    // Ensure prompt is within limits
    if (promptContent.length > 600) {
      promptContent = promptContent.slice(0, 600);
    }
    if (promptContent.length < 10) {
      promptContent = promptContent.padEnd(10, '.');
    }

    // Prepare style prompt
    let styleContent = input.stylePrompt;
    if (input.instrumental) {
      styleContent = `${styleContent}, instrumental, no vocals`;
    }

    // Ensure style is within limits
    if (styleContent.length > 3000) {
      styleContent = styleContent.slice(0, 3000);
    }
    if (styleContent.length < 10) {
      styleContent = styleContent.padEnd(10, '.');
    }

    // MiniMax Music v1.5 API request body
    const requestBody = {
      prompt: promptContent,
      lyrics_prompt: styleContent,
    };

    console.log('MiniMax Music v1.5 request:', JSON.stringify(requestBody, null, 2));

    // Use v1.5 endpoint - doesn't require reference_audio_url
    const endpoint = 'https://queue.fal.run/fal-ai/minimax-music/v1.5';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MiniMax Music error response:', errorText);
      let errorMessage = 'Fal.ai request failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('MiniMax Music v1.5 response:', JSON.stringify(data, null, 2));

    return {
      success: true,
      jobId: data.request_id,
      provider: 'fal',
      status: 'processing',
      estimatedTime: 120, // ~2 minutes
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
 * Check music generation status - routes to appropriate provider
 */
export async function checkMusicGenerationStatus(
  jobId: string,
  provider: MusicProviderType = 'piapi'
): Promise<MusicGenerationResult> {
  if (provider === 'suno') {
    return checkSunoStatusWrapper(jobId);
  }
  if (provider === 'piapi') {
    return checkPiAPIStatusWrapper(jobId);
  }
  return checkFalStatus(jobId);
}

/**
 * Check Suno generation status
 */
async function checkSunoStatusWrapper(
  jobId: string
): Promise<MusicGenerationResult> {
  const result = await checkSunoStatus(jobId);

  return {
    success: result.success,
    jobId: result.taskId,
    provider: 'suno',
    status: result.status,
    audioUrl: result.audioUrls?.[0],  // Primary clip
    audioUrls: result.audioUrls,
    error: result.error,
  };
}

/**
 * Check PiAPI (Udio) generation status
 */
async function checkPiAPIStatusWrapper(
  jobId: string
): Promise<MusicGenerationResult> {
  const result = await checkPiAPIStatus(jobId);

  return {
    success: result.success,
    jobId: result.taskId,
    provider: 'piapi',
    status: result.status,
    audioUrl: result.audioUrls?.[0],  // Primary clip
    audioUrls: result.audioUrls,
    error: result.error,
  };
}

/**
 * Check Fal.ai (MiniMax) generation status
 * Note: First check /status endpoint, then fetch full result from main endpoint
 */
async function checkFalStatus(
  jobId: string
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

  try {
    // First check status endpoint
    const statusUrl = `https://queue.fal.run/fal-ai/minimax-music/requests/${jobId}/status`;

    const statusResponse = await fetch(statusUrl, {
      headers: {
        'Authorization': `Key ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Fal.ai music status check failed:', statusResponse.status, errorText);
      throw new Error(`Failed to check Fal.ai status: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    console.log('MiniMax status:', statusData.status, 'for job:', jobId);

    if (statusData.status === 'COMPLETED') {
      // Fetch full result from main endpoint (not /status)
      const resultUrl = `https://queue.fal.run/fal-ai/minimax-music/requests/${jobId}`;
      const resultResponse = await fetch(resultUrl, {
        headers: {
          'Authorization': `Key ${apiKey}`,
        },
      });

      let audioUrl: string | undefined;

      if (resultResponse.ok) {
        const result = await resultResponse.json();
        console.log('MiniMax result:', JSON.stringify(result, null, 2));
        audioUrl = result.audio?.url || result.audio_url;
      }

      return {
        success: true,
        jobId,
        provider: 'fal',
        status: 'completed',
        audioUrl,
      };
    }

    if (statusData.status === 'FAILED') {
      return {
        success: false,
        jobId,
        provider: 'fal',
        status: 'failed',
        error: statusData.error || 'Generation failed',
      };
    }

    // IN_QUEUE or IN_PROGRESS
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
 * Cancel music generation - routes to appropriate provider
 */
export async function cancelMusicGeneration(
  jobId: string,
  provider: MusicProviderType = 'piapi'
): Promise<boolean> {
  if (provider === 'suno') {
    return cancelSunoGeneration(jobId);
  }
  if (provider === 'piapi') {
    return cancelPiAPIGeneration(jobId);
  }
  return cancelFalGeneration(jobId);
}

/**
 * Cancel Fal.ai (MiniMax) generation
 */
async function cancelFalGeneration(jobId: string): Promise<boolean> {
  try {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) return false;

    await fetch(`https://queue.fal.run/fal-ai/minimax-music/requests/${jobId}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Key ${apiKey}` },
    });
    return true;
  } catch (error) {
    console.error('Cancel music generation error:', error);
    return false;
  }
}
