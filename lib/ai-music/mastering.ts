/**
 * AI Mastering Module
 *
 * Integracja z AI Mastering API (Bakuage) - darmowe API
 * Opcjonalnie LANDR dla profesjonalnego masteringu
 */

import { MasteringIntensity, getMasteringCost } from './models';

export interface MasteringInput {
  audioUrl: string; // URL to the audio file to master
  intensity: MasteringIntensity;
  musicId: string;
  userId: string;
}

export interface MasteringResult {
  success: boolean;
  jobId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  masteredUrl?: string;
  error?: string;
  estimatedTime?: number;
  provider: 'ai-mastering' | 'landr';
}

// AI Mastering (Bakuage) - Free API
// Documentation: https://api.bakuage.com/swagger-ui.html

/**
 * Start mastering via AI Mastering (Bakuage) API
 */
async function masterViaAIMastering(
  input: MasteringInput
): Promise<MasteringResult> {
  const apiKey = process.env.AI_MASTERING_API_KEY;

  // AI Mastering can work without API key for basic features
  // but with API key provides better quality

  try {
    // Step 1: Create a new mastering job
    const createResponse = await fetch('https://api.bakuage.com/masterings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        input_audio_url: input.audioUrl,
        // Mastering parameters based on intensity
        target_loudness: getTargetLoudness(input.intensity),
        mastering: true,
        // Additional settings
        preserve_dynamics: input.intensity === 'lo',
        bass_preservation: true,
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.message || 'AI Mastering request failed');
    }

    const data = await createResponse.json();

    return {
      success: true,
      jobId: data.id,
      status: 'processing',
      estimatedTime: 120, // ~2 minutes typical
      provider: 'ai-mastering',
    };
  } catch (error) {
    console.error('AI Mastering error:', error);
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'ai-mastering',
    };
  }
}

/**
 * Check AI Mastering job status
 */
async function checkAIMasteringStatus(jobId: string): Promise<MasteringResult> {
  const apiKey = process.env.AI_MASTERING_API_KEY;

  try {
    const response = await fetch(`https://api.bakuage.com/masterings/${jobId}`, {
      headers: {
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check mastering status');
    }

    const data = await response.json();

    if (data.status === 'succeeded' || data.status === 'completed') {
      return {
        success: true,
        jobId,
        status: 'completed',
        masteredUrl: data.output_audio_url,
        provider: 'ai-mastering',
      };
    }

    if (data.status === 'failed' || data.status === 'error') {
      return {
        success: false,
        jobId,
        status: 'failed',
        error: data.error_message || 'Mastering failed',
        provider: 'ai-mastering',
      };
    }

    // Still processing
    return {
      success: true,
      jobId,
      status: 'processing',
      provider: 'ai-mastering',
    };
  } catch (error) {
    return {
      success: false,
      jobId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'ai-mastering',
    };
  }
}

/**
 * LANDR Mastering (Premium option)
 * Requires LANDR API key and costs ~$2.50 per track
 */
async function masterViaLANDR(
  input: MasteringInput
): Promise<MasteringResult> {
  const apiKey = process.env.LANDR_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      status: 'failed',
      error: 'LANDR_API_KEY is not configured',
      provider: 'landr',
    };
  }

  try {
    // LANDR API integration
    // Note: LANDR API requires OAuth2 authentication
    // This is a simplified version - actual implementation may need OAuth flow

    const response = await fetch('https://api.landr.com/mastering/v1/tracks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        source_url: input.audioUrl,
        intensity: input.intensity,
        sample_rate: 44100,
        bit_depth: 24,
        format: 'wav',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'LANDR request failed');
    }

    const data = await response.json();

    return {
      success: true,
      jobId: data.id,
      status: 'processing',
      estimatedTime: 300, // ~5 minutes typical for LANDR
      provider: 'landr',
    };
  } catch (error) {
    console.error('LANDR mastering error:', error);
    return {
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'landr',
    };
  }
}

/**
 * Check LANDR mastering status
 */
async function checkLANDRStatus(jobId: string): Promise<MasteringResult> {
  const apiKey = process.env.LANDR_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      status: 'failed',
      error: 'LANDR_API_KEY is not configured',
      provider: 'landr',
    };
  }

  try {
    const response = await fetch(`https://api.landr.com/mastering/v1/tracks/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check LANDR status');
    }

    const data = await response.json();

    if (data.status === 'completed' || data.status === 'finished') {
      return {
        success: true,
        jobId,
        status: 'completed',
        masteredUrl: data.download_url,
        provider: 'landr',
      };
    }

    if (data.status === 'failed' || data.status === 'error') {
      return {
        success: false,
        jobId,
        status: 'failed',
        error: data.error || 'Mastering failed',
        provider: 'landr',
      };
    }

    return {
      success: true,
      jobId,
      status: 'processing',
      provider: 'landr',
    };
  } catch (error) {
    return {
      success: false,
      jobId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'landr',
    };
  }
}

/**
 * Main mastering function
 * Uses AI Mastering by default (free), LANDR for premium
 */
export async function masterAudio(
  input: MasteringInput,
  usePremium: boolean = false
): Promise<MasteringResult> {
  if (usePremium && process.env.LANDR_API_KEY) {
    return masterViaLANDR(input);
  }

  return masterViaAIMastering(input);
}

/**
 * Check mastering status
 */
export async function checkMasteringStatus(
  jobId: string,
  provider: 'ai-mastering' | 'landr' = 'ai-mastering'
): Promise<MasteringResult> {
  if (provider === 'landr') {
    return checkLANDRStatus(jobId);
  }

  return checkAIMasteringStatus(jobId);
}

/**
 * Get target loudness based on intensity
 * LUFS (Loudness Units Full Scale)
 */
function getTargetLoudness(intensity: MasteringIntensity): number {
  switch (intensity) {
    case 'lo':
      return -14; // Spotify/streaming standard, dynamic
    case 'med':
      return -11; // Balanced, good for most genres
    case 'hi':
      return -8; // Loud, punchy, good for EDM/Rock
    default:
      return -11;
  }
}

/**
 * Calculate mastering cost
 */
export function calculateMasteringCost(
  intensity: MasteringIntensity,
  usePremium: boolean = false
): number {
  const baseCost = getMasteringCost(intensity);

  // LANDR premium adds extra cost
  if (usePremium) {
    return baseCost + 10; // Premium costs 10 extra credits
  }

  return baseCost;
}
