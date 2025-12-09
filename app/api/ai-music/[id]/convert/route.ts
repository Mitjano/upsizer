import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import { convertAudio, getFormatCreditCost, deleteConvertedFile } from '@/lib/ai-music/convert';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const format = body.format as 'wav' | 'flac';

    if (!format || !['wav', 'flac'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "wav" or "flac"' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, credits: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get music record
    const music = await prisma.generatedMusic.findUnique({
      where: { id },
    });

    if (!music) {
      return NextResponse.json(
        { error: 'Music not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (music.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if track is completed
    if (music.status !== 'completed') {
      return NextResponse.json(
        { error: 'Cannot convert incomplete track' },
        { status: 400 }
      );
    }

    // Check credits
    const creditCost = getFormatCreditCost(format);
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

    // Get source file path
    let sourcePath: string | null = null;

    if (music.localPath) {
      const fullPath = path.join(process.cwd(), music.localPath);
      if (fs.existsSync(fullPath)) {
        sourcePath = fullPath;
      }
    }

    // If no local file, download from URL first
    if (!sourcePath && music.audioUrl) {
      const response = await fetch(music.audioUrl);
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch source audio' },
          { status: 502 }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const tempDir = path.join(process.cwd(), 'public', 'music', 'temp');

      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      sourcePath = path.join(tempDir, `${id}_source.mp3`);
      fs.writeFileSync(sourcePath, Buffer.from(arrayBuffer));
    }

    if (!sourcePath) {
      return NextResponse.json(
        { error: 'Source audio not available' },
        { status: 404 }
      );
    }

    // Convert to requested format
    const result = await convertAudio(sourcePath, format, {
      sampleRate: 44100,
      bitDepth: format === 'wav' ? 16 : 24,
    });

    // Clean up temp source if we downloaded it
    if (sourcePath.includes('temp') && sourcePath.endsWith('_source.mp3')) {
      try {
        fs.unlinkSync(sourcePath);
      } catch {
        // Ignore cleanup errors
      }
    }

    if (!result.success || !result.outputPath) {
      return NextResponse.json(
        { error: result.error || 'Conversion failed' },
        { status: 500 }
      );
    }

    // Deduct credits
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: creditCost } },
    });

    // Read converted file
    const convertedBuffer = fs.readFileSync(result.outputPath);

    // Clean up converted file
    await deleteConvertedFile(result.outputPath);

    // Set appropriate content type
    const contentType = format === 'wav' ? 'audio/wav' : 'audio/flac';
    const filename = `${music.title || 'song'}.${format}`;

    return new NextResponse(convertedBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': convertedBuffer.length.toString(),
        'X-Credits-Used': creditCost.toString(),
      },
    });
  } catch (error) {
    console.error('Music conversion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - check conversion availability
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { credits: true },
    });

    return NextResponse.json({
      available: true,
      formats: [
        { format: 'wav', cost: 2, description: '16-bit WAV (Lossless)' },
        { format: 'flac', cost: 3, description: '24-bit FLAC (High Quality)' },
      ],
      userCredits: user?.credits || 0,
    });
  } catch (error) {
    console.error('Conversion info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
