import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  generateMusic,
  createMusicRecord,
  calculateMusicCost,
  type MusicDuration,
  type MusicStyle,
  type MusicMood,
  type MusicModelId,
} from '@/lib/ai-music';

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
      prompt,
      lyrics,
      style,
      mood,
      duration,
      instrumental,
      bpm,
      key,
      title,
      folderId,
      model = 'minimax-music-2.0',
    } = body;

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a detailed description of your song (at least 10 characters)' },
        { status: 400 }
      );
    }

    // Validate duration
    const validDurations: MusicDuration[] = [60, 120, 180, 240, 300];
    if (!validDurations.includes(duration)) {
      return NextResponse.json(
        { error: 'Invalid duration. Allowed: 60, 120, 180, 240, 300 seconds' },
        { status: 400 }
      );
    }

    // Calculate cost
    const creditCost = calculateMusicCost(model as MusicModelId, duration);

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

    // Reserve credits
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: creditCost } },
    });

    // Create music record
    const musicRecord = await createMusicRecord({
      userId: user.id,
      userEmail: user.email,
      userName: user.name || undefined,
      prompt: prompt.trim(),
      lyrics: lyrics?.trim() || undefined,
      style: style as MusicStyle,
      mood: mood as MusicMood,
      model: model as MusicModelId,
      provider: 'fal',
      duration: duration as MusicDuration,
      instrumental: instrumental || false,
      bpm: bpm || undefined,
      key: key || undefined,
      title: title?.trim() || undefined,
      folderId: folderId || undefined,
      creditsReserved: creditCost,
    });

    // Start generation
    const result = await generateMusic({
      prompt: prompt.trim(),
      lyrics: lyrics?.trim(),
      style: style as MusicStyle,
      mood: mood as MusicMood,
      duration: duration as MusicDuration,
      instrumental: instrumental || false,
      bpm: bpm,
      key: key,
      model: model as MusicModelId,
    });

    if (!result.success) {
      // Refund credits on failure
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: creditCost } },
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
      creditsUsed: creditCost,
    });
  } catch (error) {
    console.error('Music generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
