/**
 * AI Music Generation Module
 *
 * Obsługuje generowanie muzyki przez Fal.ai (MiniMax Music 2.0)
 */

export interface MusicGenerationInput {
  prompt: string;        // Tekst piosenki / lyrics (dla custom) lub opis (dla simple)
  stylePrompt: string;   // Style of music description
  instrumental?: boolean;
  title?: string;
  mode?: 'simple' | 'custom';
}

export interface MusicGenerationResult {
  success: boolean;
  jobId?: string;
  provider: 'fal';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  error?: string;
  estimatedTime?: number;
}

/**
 * Generate music via Fal.ai (MiniMax Music 2.0)
 */
export async function generateMusic(
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
    // MiniMax Music 2.0 API parameters:
    // - prompt: Lyrics with structure tags (10-600 chars) - TEKST PIOSENKI
    // - lyrics_prompt: Style/mood description (10-3000 chars) - OPIS STYLU MUZYKI

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

    // MiniMax Music 2.0 API request body
    const requestBody = {
      prompt: promptContent,
      lyrics_prompt: styleContent,
    };

    console.log('MiniMax Music request:', JSON.stringify(requestBody, null, 2));

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
    console.log('MiniMax Music response:', JSON.stringify(data, null, 2));

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
 * Check music generation status
 */
export async function checkMusicGenerationStatus(
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
    console.log('MiniMax status:', data.status, 'for job:', jobId);

    if (data.status === 'COMPLETED') {
      // Fetch the result
      const resultResponse = await fetch(`https://queue.fal.run/${modelEndpoint}/requests/${jobId}`, {
        headers: {
          'Authorization': `Key ${apiKey}`,
        },
      });
      const result = await resultResponse.json();
      console.log('MiniMax result:', JSON.stringify(result, null, 2));

      // MiniMax returns audio in different formats depending on version
      const audioUrl = result.audio?.url || result.audio_url || result.output?.audio_url;

      return {
        success: true,
        jobId,
        provider: 'fal',
        status: 'completed',
        audioUrl,
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
 * Cancel music generation (if supported)
 */
export async function cancelMusicGeneration(jobId: string): Promise<boolean> {
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
