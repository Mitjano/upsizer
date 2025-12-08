/**
 * PiAPI Music Provider
 *
 * Integracja z PiAPI.ai dla generowania muzyki
 * Używa modelu music-u (Udio) przez PiAPI unified task API
 *
 * API: https://api.piapi.ai/api/v1/task
 * Docs: https://piapi.ai/docs
 */

export interface PiAPIGenerationInput {
  prompt: string;           // Music description / lyrics
  stylePrompt?: string;     // Style tags and description
  title?: string;           // Song title
  instrumental?: boolean;   // Generate without vocals
  negativePrompt?: string;  // Tags to avoid
}

export interface PiAPIGenerationResult {
  success: boolean;
  taskId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrls?: string[];
  error?: string;
  estimatedTime?: number;
}

export interface PiAPIStatusResult {
  success: boolean;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrls?: string[];
  songs?: PiAPISong[];
  error?: string;
}

export interface PiAPISong {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  duration?: number;
  status: string;
}

// PiAPI unified task API endpoint
const PIAPI_BASE_URL = 'https://api.piapi.ai/api/v1';

/**
 * Generate music via PiAPI (music-u model - Udio)
 */
export async function generateMusicPiAPI(
  input: PiAPIGenerationInput
): Promise<PiAPIGenerationResult> {
  const apiKey = process.env.GOAPI_API_KEY; // PiAPI uses the same key as GoAPI
  if (!apiKey) {
    return {
      success: false,
      status: 'failed',
      error: 'GOAPI_API_KEY (PiAPI) is not configured',
    };
  }

  try {
    // Build prompt from input
    let fullPrompt = input.stylePrompt || input.prompt;
    if (input.instrumental) {
      fullPrompt = `${fullPrompt}, instrumental, no vocals`;
    }

    // Build request body for PiAPI unified task API
    const requestBody: Record<string, unknown> = {
      model: 'music-u', // Udio model via PiAPI
      task_type: 'generate_music',
      input: {
        prompt: fullPrompt,
        lyrics_type: input.instrumental ? 'instrumental' : 'generate',
        title: input.title || undefined,
        negative_tags: input.negativePrompt || undefined,
      },
    };

    // Add lyrics for custom mode with user-provided lyrics
    if (!input.instrumental && input.prompt && input.stylePrompt) {
      (requestBody.input as Record<string, unknown>).lyrics = input.prompt;
      (requestBody.input as Record<string, unknown>).lyrics_type = 'user';
      (requestBody.input as Record<string, unknown>).gpt_description_prompt = input.stylePrompt;
    }

    console.log('PiAPI music request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${PIAPI_BASE_URL}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PiAPI error response:', errorText);
      let errorMessage = 'Music generation failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error?.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('PiAPI response:', JSON.stringify(data, null, 2));

    // PiAPI unified API returns: { code: 200, data: { task_id: "..." }, message: "success" }
    const taskId = data.data?.task_id;
    if (!taskId) {
      throw new Error(data.message || 'Failed to create task');
    }

    return {
      success: true,
      taskId: taskId,
      status: 'processing',
      estimatedTime: 180, // Udio typically takes 2-3 minutes
    };
  } catch (error) {
    console.error('PiAPI generation error:', error);
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check music generation status via PiAPI unified task API
 */
export async function checkPiAPIStatus(
  taskId: string
): Promise<PiAPIStatusResult> {
  const apiKey = process.env.GOAPI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      taskId,
      status: 'failed',
      error: 'GOAPI_API_KEY (PiAPI) is not configured',
    };
  }

  try {
    // PiAPI unified task API: GET /api/v1/task/{task_id}
    const response = await fetch(`${PIAPI_BASE_URL}/task/${taskId}`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PiAPI status check failed:', response.status, errorText);
      throw new Error(`Failed to check status: ${response.status}`);
    }

    const data = await response.json();
    console.log('PiAPI status response:', JSON.stringify(data, null, 2));

    // Parse response - PiAPI returns: { code: 200, data: { status: "...", output: {...} } }
    const taskData = data.data || data;
    const status = parsePiAPIStatus(taskData.status);

    if (status === 'completed') {
      // Output contains the audio URL(s)
      const output = taskData.output || {};

      // music-u output format: { generation_id: "...", songs: [...] }
      const songs: PiAPISong[] = [];

      if (output.songs && Array.isArray(output.songs)) {
        for (const song of output.songs) {
          if (song.audio_url || song.song_path) {
            songs.push({
              id: song.id || song.song_id || taskId,
              title: song.title || 'Generated Music',
              audioUrl: song.audio_url || song.song_path,
              imageUrl: song.image_url || song.image_path,
              duration: song.duration,
              status: 'completed',
            });
          }
        }
      }

      // Fallback: check for single audio URL
      if (songs.length === 0) {
        const audioUrl = output.audio_url || output.url || output.audio;
        if (audioUrl) {
          songs.push({
            id: taskId,
            title: output.title || 'Generated Music',
            audioUrl: audioUrl,
            imageUrl: output.image_url,
            duration: output.duration,
            status: 'completed',
          });
        }
      }

      return {
        success: true,
        taskId,
        status: 'completed',
        audioUrls: songs.map(s => s.audioUrl).filter(Boolean),
        songs,
      };
    }

    if (status === 'failed') {
      const errorInfo = taskData.error || {};
      return {
        success: false,
        taskId,
        status: 'failed',
        error: errorInfo.message || errorInfo.raw_message || 'Generation failed',
      };
    }

    // Still processing
    return {
      success: true,
      taskId,
      status,
    };
  } catch (error) {
    return {
      success: false,
      taskId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Parse PiAPI status to our internal status
 */
function parsePiAPIStatus(
  status: string
): 'pending' | 'processing' | 'completed' | 'failed' {
  const statusLower = status?.toLowerCase() || '';

  if (statusLower === 'completed' || statusLower === 'complete') {
    return 'completed';
  }
  if (statusLower === 'failed' || statusLower === 'error') {
    return 'failed';
  }
  if (statusLower === 'pending' || statusLower === 'queued' || statusLower === 'staged') {
    return 'pending';
  }
  // processing, running, in_progress, etc.
  return 'processing';
}

/**
 * Cancel PiAPI generation (best effort)
 */
export async function cancelPiAPIGeneration(taskId: string): Promise<boolean> {
  // PiAPI doesn't have a direct cancel endpoint
  // Just return true and let the task complete in the background
  console.log('PiAPI cancellation requested for:', taskId);
  return true;
}
