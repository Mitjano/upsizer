import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  masterAudio,
  getMasteringCost,
  updateMusicRecord,
  type MasteringIntensity,
} from '@/lib/ai-music';

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
    const { intensity = 'med', usePremium = false } = body;

    // Validate intensity
    const validIntensities: MasteringIntensity[] = ['lo', 'med', 'hi'];
    if (!validIntensities.includes(intensity)) {
      return NextResponse.json(
        { error: 'Invalid mastering intensity. Allowed: lo, med, hi' },
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

    // Check if music is completed
    if (music.status !== 'completed') {
      return NextResponse.json(
        { error: 'Music must be generated first' },
        { status: 400 }
      );
    }

    // Check if already mastering
    if (music.masteringStatus === 'processing' || music.masteringStatus === 'pending') {
      return NextResponse.json(
        { error: 'Mastering already in progress' },
        { status: 400 }
      );
    }

    // Calculate cost
    let creditCost = getMasteringCost(intensity);
    if (usePremium) {
      creditCost += 10; // Premium LANDR adds 10 credits
    }

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

    // Get audio URL
    const audioUrl = music.localPath
      ? `${process.env.NEXT_PUBLIC_APP_URL}/${music.localPath.replace(/^\.?\/?(?:public\/)?/, '')}`
      : music.audioUrl;

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'No audio file available' },
        { status: 400 }
      );
    }

    // Reserve credits
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: creditCost } },
    });

    // Update record to mastering pending
    await updateMusicRecord(id, {
      masteringStatus: 'pending',
      masteringIntensity: intensity,
      masteringProvider: usePremium ? 'landr' : 'ai-mastering',
    });

    // Start mastering
    const result = await masterAudio(
      {
        audioUrl,
        intensity,
        musicId: id,
        userId: user.id,
      },
      usePremium
    );

    if (!result.success) {
      // Refund credits on failure
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: creditCost } },
      });

      await updateMusicRecord(id, {
        masteringStatus: 'failed',
        errorMessage: result.error,
      });

      return NextResponse.json(
        { error: result.error || 'Mastering failed' },
        { status: 500 }
      );
    }

    // Update record with job ID
    await updateMusicRecord(id, {
      masteringStatus: 'processing',
      masteringJobId: result.jobId,
      masteringCost: creditCost,
    });

    return NextResponse.json({
      success: true,
      musicId: id,
      masteringJobId: result.jobId,
      status: 'processing',
      estimatedTime: result.estimatedTime,
      creditsUsed: creditCost,
      provider: result.provider,
    });
  } catch (error) {
    console.error('Mastering error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
