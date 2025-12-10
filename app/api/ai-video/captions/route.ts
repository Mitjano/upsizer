import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getToolCost, type ToolType } from '@/lib/credits-config';
import { prisma } from '@/lib/prisma';
import { createUsage } from '@/lib/db';
import Replicate from 'replicate';

// Output format options
const OUTPUT_FORMATS = ['srt', 'vtt', 'json', 'txt'] as const;
type OutputFormat = typeof OUTPUT_FORMATS[number];

// Language options for transcription
const LANGUAGES = {
  'auto': 'Auto-detect',
  'en': 'English',
  'pl': 'Polish',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
};

type LanguageCode = keyof typeof LANGUAGES;

function getReplicateClient(): Replicate {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }
  return new Replicate({ auth: apiToken });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mediaUrl = formData.get('mediaUrl') as string | null;
    const language = (formData.get('language') as string) || 'auto';
    const outputFormat = (formData.get('outputFormat') as string) || 'srt';

    // Validate input - either file or URL
    if (!file && !mediaUrl) {
      return NextResponse.json(
        { error: 'Please provide either a file or media URL' },
        { status: 400 }
      );
    }

    // Validate URL format - must be direct audio/video file URL
    if (mediaUrl) {
      const url = mediaUrl.toLowerCase();
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
      const isVimeo = url.includes('vimeo.com');
      const isTikTok = url.includes('tiktok.com');

      if (isYouTube || isVimeo || isTikTok) {
        return NextResponse.json(
          { error: 'YouTube, Vimeo, and TikTok URLs are not supported. Please upload the audio/video file directly or provide a direct URL to an audio file (mp3, wav, m4a, etc.)' },
          { status: 400 }
        );
      }
    }

    // Validate output format
    if (!OUTPUT_FORMATS.includes(outputFormat as OutputFormat)) {
      return NextResponse.json(
        { error: 'Invalid output format' },
        { status: 400 }
      );
    }

    // Validate language
    if (!LANGUAGES[language as LanguageCode]) {
      return NextResponse.json(
        { error: 'Invalid language' },
        { status: 400 }
      );
    }

    // Get user and check credits
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, credits: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const creditCost = getToolCost('captions' as ToolType);

    // Check credits
    if (user.credits < creditCost) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditCost,
          available: user.credits,
        },
        { status: 402 }
      );
    }

    // Prepare audio URL
    let audioUrl: string;

    if (mediaUrl) {
      audioUrl = mediaUrl;
    } else if (file) {
      // Convert file to base64 data URL for Replicate
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = file.type || 'audio/mpeg';
      audioUrl = `data:${mimeType};base64,${base64}`;
    } else {
      return NextResponse.json(
        { error: 'No media provided' },
        { status: 400 }
      );
    }

    // Call Replicate Whisper API
    const replicate = getReplicateClient();

    const input: Record<string, unknown> = {
      audio: audioUrl,
      model: 'large-v3',
      translate: false,
      temperature: 0,
      transcription: 'plain text',
      suppress_tokens: '-1',
      logprob_threshold: -1,
      no_speech_threshold: 0.6,
      condition_on_previous_text: true,
      compression_ratio_threshold: 2.4,
      temperature_increment_on_fallback: 0.2,
    };

    // Set language (if not auto-detect)
    if (language !== 'auto') {
      input.language = language;
    }

    const output = await replicate.run(
      'openai/whisper:8099696689d249cf8b122d833c36ac3f75505c666a395ca40ef26f68e7d3d16e',
      { input }
    ) as { transcription?: string; segments?: Array<{ start: number; end: number; text: string }> };

    if (!output || (!output.transcription && !output.segments)) {
      return NextResponse.json(
        { error: 'Failed to generate captions' },
        { status: 500 }
      );
    }

    // Deduct credits after successful generation
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: creditCost } },
    });

    // Log usage
    await createUsage({
      userId: user.id,
      type: 'captions',
      creditsUsed: creditCost,
      model: 'whisper-large-v3',
    });

    // Format output based on requested format
    let formattedOutput: string;
    const segments = output.segments || [];

    switch (outputFormat) {
      case 'srt':
        formattedOutput = formatSRT(segments);
        break;
      case 'vtt':
        formattedOutput = formatVTT(segments);
        break;
      case 'json':
        formattedOutput = JSON.stringify(segments, null, 2);
        break;
      case 'txt':
      default:
        formattedOutput = output.transcription || segments.map(s => s.text).join(' ');
        break;
    }

    return NextResponse.json({
      success: true,
      transcription: output.transcription,
      segments: segments,
      formattedOutput,
      outputFormat,
      language: language === 'auto' ? 'auto-detected' : language,
      metadata: {
        segmentCount: segments.length,
        duration: segments.length > 0 ? segments[segments.length - 1].end : 0,
        creditsUsed: creditCost,
        remainingCredits: user.credits - creditCost,
      },
    });
  } catch (error) {
    console.error('Captions generation error:', error);

    // Handle specific errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('REPLICATE_API_TOKEN')) {
      return NextResponse.json(
        { error: 'Transcription service not configured' },
        { status: 500 }
      );
    }

    if (errorMessage.includes('Invalid') || errorMessage.includes('URL')) {
      return NextResponse.json(
        { error: 'Invalid audio URL. Please provide a direct link to an audio file (mp3, wav, m4a, etc.)' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate captions. Please try uploading the file directly.' },
      { status: 500 }
    );
  }
}

// Format segments to SRT format
function formatSRT(segments: Array<{ start: number; end: number; text: string }>): string {
  return segments.map((segment, index) => {
    const startTime = formatTimeSRT(segment.start);
    const endTime = formatTimeSRT(segment.end);
    return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text.trim()}\n`;
  }).join('\n');
}

// Format segments to VTT format
function formatVTT(segments: Array<{ start: number; end: number; text: string }>): string {
  const header = 'WEBVTT\n\n';
  const body = segments.map((segment, index) => {
    const startTime = formatTimeVTT(segment.start);
    const endTime = formatTimeVTT(segment.end);
    return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text.trim()}\n`;
  }).join('\n');
  return header + body;
}

// Format time for SRT (HH:MM:SS,mmm)
function formatTimeSRT(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds % 1) * 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`;
}

// Format time for VTT (HH:MM:SS.mmm)
function formatTimeVTT(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds % 1) * 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(millis, 3)}`;
}

function pad(num: number, size: number = 2): string {
  return num.toString().padStart(size, '0');
}

// GET endpoint to return available options
export async function GET() {
  return NextResponse.json({
    languages: Object.entries(LANGUAGES).map(([code, name]) => ({
      code,
      name,
    })),
    outputFormats: [
      { id: 'srt', name: 'SRT (SubRip)', description: 'Most common format for video subtitles' },
      { id: 'vtt', name: 'WebVTT', description: 'Web standard format for HTML5 video' },
      { id: 'json', name: 'JSON', description: 'Structured data with timestamps' },
      { id: 'txt', name: 'Plain Text', description: 'Simple text transcription' },
    ],
    limits: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      supportedFormats: ['mp3', 'mp4', 'wav', 'webm', 'm4a', 'ogg', 'flac'],
    },
    pricing: {
      cost: 3,
      description: '3 credits per transcription',
    },
  });
}
