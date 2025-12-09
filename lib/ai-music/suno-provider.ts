/**
 * Suno Music Provider via GoAPI
 *
 * Integracja z Suno AI przez GoAPI.ai
 * Dokumentacja: https://github.com/Goapiai/Suno-API
 */

export interface SunoGenerationInput {
  prompt: string;           // Song description (for simple mode) or lyrics (for custom mode)
  stylePrompt?: string;     // Style tags and description
  title?: string;           // Song title
  instrumental?: boolean;   // Generate without vocals
  mode?: 'simple' | 'custom';
  // Note: Duration is NOT supported by GoAPI - Suno generates ~2-3 min tracks automatically
}

export interface SunoGenerationResult {
  success: boolean;
  taskId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrls?: string[];     // Suno generates 2 clips per request
  error?: string;
  estimatedTime?: number;
}

export interface SunoStatusResult {
  success: boolean;
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrls?: string[];
  clips?: SunoClip[];
  error?: string;
}

export interface SunoClip {
  id: string;
  title: string;
  audioUrl: string;
  imageUrl?: string;
  duration?: number;
  status: string;
}

// GoAPI Unified Task API endpoint
// Docs: https://goapi.ai/docs/music-api/create-task
// Model: music-u (Suno-based), pricing: $0.05/generation
const GOAPI_BASE_URL = 'https://api.goapi.ai/api/v1';

/**
 * Generate music via GoAPI (music-u model)
 */
export async function generateMusicSuno(
  input: SunoGenerationInput
): Promise<SunoGenerationResult> {
  const apiKey = process.env.GOAPI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      status: 'failed',
      error: 'GOAPI_API_KEY is not configured',
    };
  }

  try {
    // Determine lyrics type based on input
    // - 'instrumental': no vocals
    // - 'user': user provides lyrics, AI generates music to match
    // - 'generate': AI generates both lyrics and music from prompt
    let lyricsType: 'generate' | 'instrumental' | 'user';
    if (input.instrumental) {
      lyricsType = 'instrumental';
    } else if (input.mode === 'custom' && input.prompt && input.prompt.trim().length > 0) {
      lyricsType = 'user';
    } else {
      lyricsType = 'generate';
    }

    // Build request body for GoAPI unified task API
    // IMPORTANT: 'prompt' field = style/genre/mood TAGS (not lyrics!)
    // 'lyrics' field = actual song lyrics (when lyrics_type: user)
    // 'gpt_description_prompt' = description for AI when using user lyrics
    const requestBody: Record<string, unknown> = {
      model: 'music-u',
      task_type: 'generate_music',
      input: {
        lyrics_type: lyricsType,
        // 'prompt' is for STYLE TAGS like "electronic, dark, synth, edm"
        prompt: input.stylePrompt || input.prompt,
        title: input.title || undefined,
      },
    };

    // Add lyrics for custom mode with user-provided lyrics
    if (lyricsType === 'user' && input.prompt) {
      const inputObj = requestBody.input as Record<string, unknown>;
      inputObj.lyrics = input.prompt;  // User's lyrics text
      inputObj.gpt_description_prompt = input.stylePrompt || 'Create a song matching the lyrics';
    }

    // For 'generate' mode (simple), use gpt_description_prompt for better results
    if (lyricsType === 'generate') {
      const inputObj = requestBody.input as Record<string, unknown>;
      inputObj.gpt_description_prompt = input.prompt || input.stylePrompt;
    }

    console.log('GoAPI music request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${GOAPI_BASE_URL}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GoAPI error response:', errorText);
      let errorMessage = 'Music generation failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorData.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('GoAPI response:', JSON.stringify(data, null, 2));

    // GoAPI unified API returns: { data: { task_id: "..." }, ... }
    const taskId = data.data?.task_id || data.task_id;
    if (!taskId) {
      throw new Error(data.error?.message || data.message || 'Failed to create task');
    }

    return {
      success: true,
      taskId: taskId,
      status: 'processing',
      estimatedTime: 120, // Typically takes 1-3 minutes
    };
  } catch (error) {
    console.error('GoAPI generation error:', error);
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check music generation status via GoAPI unified task API
 */
export async function checkSunoStatus(
  taskId: string
): Promise<SunoStatusResult> {
  const apiKey = process.env.GOAPI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      taskId,
      status: 'failed',
      error: 'GOAPI_API_KEY is not configured',
    };
  }

  try {
    // GoAPI unified task API: GET /api/v1/task/{task_id}
    const response = await fetch(`${GOAPI_BASE_URL}/task/${taskId}`, {
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GoAPI status check failed:', response.status, errorText);
      throw new Error(`Failed to check status: ${response.status}`);
    }

    const data = await response.json();
    console.log('GoAPI status response:', JSON.stringify(data, null, 2));

    // Parse response - GoAPI unified API returns: { data: { status: "...", output: {...} } }
    const taskData = data.data || data;
    const status = parseGoAPIStatus(taskData.status);

    if (status === 'completed') {
      // Output contains the audio URL(s)
      const output = taskData.output || {};
      const audioUrl = output.audio_url || output.url || output.audio;

      // Some responses may have multiple clips
      const clips: SunoClip[] = [];
      if (output.clips && Array.isArray(output.clips)) {
        for (const clip of output.clips) {
          clips.push({
            id: clip.id || taskId,
            title: clip.title || 'Generated Music',
            audioUrl: clip.audio_url || clip.url,
            imageUrl: clip.image_url,
            duration: clip.duration,
            status: 'completed',
          });
        }
      } else if (audioUrl) {
        clips.push({
          id: taskId,
          title: output.title || 'Generated Music',
          audioUrl: audioUrl,
          imageUrl: output.image_url,
          duration: output.duration,
          status: 'completed',
        });
      }

      return {
        success: true,
        taskId,
        status: 'completed',
        audioUrls: clips.map(c => c.audioUrl).filter(Boolean),
        clips,
      };
    }

    if (status === 'failed') {
      return {
        success: false,
        taskId,
        status: 'failed',
        error: taskData.error?.message || taskData.error || 'Generation failed',
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
 * Parse GoAPI status to our internal status
 */
function parseGoAPIStatus(
  status: string
): 'pending' | 'processing' | 'completed' | 'failed' {
  const statusLower = status?.toLowerCase() || '';

  if (statusLower === 'completed' || statusLower === 'complete') {
    return 'completed';
  }
  if (statusLower === 'failed' || statusLower === 'error') {
    return 'failed';
  }
  if (statusLower === 'pending' || statusLower === 'queued') {
    return 'pending';
  }
  // processing, running, in_progress, etc.
  return 'processing';
}

/**
 * Cancel Suno generation (if supported)
 */
export async function cancelSunoGeneration(taskId: string): Promise<boolean> {
  // GoAPI may not support cancellation - just return true
  // The task will complete but we won't use the result
  console.log('Suno cancellation requested for:', taskId);
  return true;
}

// ==================
// Extend Music API
// ==================

export interface SunoExtendInput {
  clipId: string;           // Suno clip ID from previous generation
  continueAt: number;       // Timestamp in seconds to continue from
  prompt?: string;          // Continuation lyrics (optional)
  style?: string;           // Style override (optional)
  title?: string;           // Title for extended track
}

export interface SunoExtendResult {
  success: boolean;
  taskId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  estimatedTime?: number;
}

/**
 * Extend/continue music via GoAPI
 * Uses task_type: "extend_music" to continue from a specific point in an existing track
 */
export async function extendMusicSuno(
  input: SunoExtendInput
): Promise<SunoExtendResult> {
  const apiKey = process.env.GOAPI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      status: 'failed',
      error: 'GOAPI_API_KEY is not configured',
    };
  }

  try {
    // Build request body for extend_music task
    const requestBody: Record<string, unknown> = {
      model: 'music-u',
      task_type: 'extend_music',
      input: {
        audio_id: input.clipId,
        continue_at: input.continueAt,
        prompt: input.style || input.prompt || '',
        title: input.title || undefined,
      },
    };

    // Add lyrics if provided
    if (input.prompt) {
      (requestBody.input as Record<string, unknown>).lyrics = input.prompt;
    }

    console.log('GoAPI extend request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${GOAPI_BASE_URL}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GoAPI extend error response:', errorText);
      let errorMessage = 'Music extension failed';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorData.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('GoAPI extend response:', JSON.stringify(data, null, 2));

    const taskId = data.data?.task_id || data.task_id;
    if (!taskId) {
      throw new Error(data.error?.message || data.message || 'Failed to create extend task');
    }

    return {
      success: true,
      taskId: taskId,
      status: 'processing',
      estimatedTime: 120,
    };
  } catch (error) {
    console.error('GoAPI extend error:', error);
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
