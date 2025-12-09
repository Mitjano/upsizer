import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  generateMusic,
  createMusicRecord,
  type MusicProviderType,
} from '@/lib/ai-music';

const CREDIT_COST = 10; // Fixed cost for Suno AI ($0.02/generation = ~10 credits)

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      prompt,        // For simple mode: description; for custom mode: lyrics
      stylePrompt,   // Style description (tags, genre, mood)
      instrumental,
      title,
      mode = 'simple',
      folderId,
      duration: requestedDuration,
    } = body;

    // Validate and clamp duration to allowed values (60, 120, 180, 240 seconds)
    const allowedDurations = [60, 120, 180, 240];
    const duration = allowedDurations.includes(requestedDuration) ? requestedDuration : 120;

    // Validate inputs based on mode
    if (mode === 'simple') {
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
        return NextResponse.json(
          { error: 'Please provide a detailed description of your song (at least 10 characters)' },
          { status: 400 }
        );
      }
    } else {
      // Custom mode - need either lyrics or instrumental with style
      if (!instrumental && (!prompt || prompt.trim().length < 10)) {
        return NextResponse.json(
          { error: 'Please provide lyrics (at least 10 characters) or enable instrumental mode' },
          { status: 400 }
        );
      }
    }

    if (!stylePrompt || typeof stylePrompt !== 'string' || stylePrompt.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please provide a style description (at least 5 characters)' },
        { status: 400 }
      );
    }

    // Check credits
    if (user.credits < CREDIT_COST) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: CREDIT_COST,
          available: user.credits,
        },
        { status: 402 }
      );
    }

    // Reserve credits
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: CREDIT_COST } },
    });

    // Determine provider - Use Fal.ai (MiniMax v1.5) as default since it works reliably
    // PiAPI/GoAPI have backend issues (error 1001), so Fal.ai is now default
    // Fallback order: Fal.ai (MiniMax v1.5) > PiAPI (Udio) > Suno/GoAPI
    const provider: MusicProviderType = process.env.FAL_API_KEY ? 'fal' :
      process.env.GOAPI_API_KEY ? 'piapi' : 'suno';
    const model = provider === 'fal' ? 'minimax-music-1.5' :
      provider === 'piapi' ? 'udio-music' : 'suno-v4';

    // Create music record
    const musicRecord = await createMusicRecord({
      userId: user.id,
      userEmail: user.email,
      userName: user.name || undefined,
      prompt: prompt?.trim() || '[Instrumental]',
      lyrics: mode === 'custom' && !instrumental ? prompt?.trim() : undefined,
      style: stylePrompt?.trim() as any,
      mood: 'energetic' as any,
      model: model as any,
      provider,
      duration, // Use user-selected duration
      instrumental: instrumental || false,
      title: title?.trim() || undefined,
      folderId: folderId || undefined,
      creditsReserved: CREDIT_COST,
    });

    // Start generation with new simplified interface
    const result = await generateMusic({

      prompt: prompt?.trim() || '',
      stylePrompt: stylePrompt.trim(),
      instrumental: instrumental || false,
      title: title?.trim(),
      mode: mode as 'simple' | 'custom',
            duration, // Pass user-selected duration (60, 120, 180, 240 seconds)
      provider, // Use determined provider
    });

    if (!result.success) {
      // Refund credits on failure
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: CREDIT_COST } },
      });

      // Update record status
      await prisma.generatedMusic.update({
        where: { id: musicRecord.id },
        data: {
          status: 'failed',
          errorMessage: result.error,
        },
      });

      return NextResponse.json(
        { error: result.error || 'Music generation failed' },
        { status: 500 }
      );
    }

    // Update record with job ID
    await prisma.generatedMusic.update({
      where: { id: musicRecord.id },
      data: {
        jobId: result.jobId,
        status: 'processing',
      },
    });

    return NextResponse.json({
      success: true,
      musicId: musicRecord.id,
      jobId: result.jobId,
      status: 'processing',
      estimatedTime: result.estimatedTime,
      creditsUsed: CREDIT_COST,
    });
  } catch (error) {
    console.error('Music generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
