import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  checkMusicGenerationStatus,
  updateMusicRecord,
  downloadAndSaveMusic,
  type MusicProvider,
} from '@/lib/ai-music';

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

    const { id } = await params;

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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user || music.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // If already completed or failed, return current status
    if (music.status === 'completed' || music.status === 'failed' || music.status === 'cancelled') {
      return NextResponse.json({
        id: music.id,
        status: music.status,
        audioUrl: music.localPath
          ? '/' + music.localPath.replace(/^\.?\/?(?:public\/)?/, '')
          : music.audioUrl,
        masteredUrl: music.masteredLocalPath
          ? '/' + music.masteredLocalPath.replace(/^\.?\/?(?:public\/)?/, '')
          : music.masteredUrl,
        masteringStatus: music.masteringStatus,
        progress: music.progress,
        errorMessage: music.errorMessage,
        createdAt: music.createdAt,
        completedAt: music.completedAt,
      });
    }

    // Check status with provider
    if (!music.jobId) {
      return NextResponse.json({
        id: music.id,
        status: music.status,
        progress: music.progress,
      });
    }

    const result = await checkMusicGenerationStatus(
      music.jobId,
      music.provider as MusicProvider
    );

    // Update progress
    if (result.status === 'processing') {
      return NextResponse.json({
        id: music.id,
        status: 'processing',
        progress: music.progress,
        estimatedTimeRemaining: calculateRemainingTime(music.createdAt),
      });
    }

    // Handle completion
    if (result.status === 'completed' && result.audioUrl) {
      const startTime = music.createdAt.getTime();
      const processingTime = Math.floor((Date.now() - startTime) / 1000);

      // Download and save audio locally
      const audioSaveResult = await downloadAndSaveMusic(result.audioUrl, music.userId);

      // Update record
      await updateMusicRecord(music.id, {
        status: 'completed',
        progress: 100,
        audioUrl: result.audioUrl,
        localPath: audioSaveResult.localPath,
        fileSize: audioSaveResult.fileSize,
        processingTime,
        creditsUsed: music.creditsReserved,
        completedAt: new Date(),
      });

      return NextResponse.json({
        id: music.id,
        status: 'completed',
        audioUrl: audioSaveResult.publicUrl || result.audioUrl,
        progress: 100,
        processingTime,
        completedAt: new Date(),
      });
    }

    // Handle failure
    if (result.status === 'failed') {
      // Refund credits
      await prisma.user.update({
        where: { id: music.userId },
        data: { credits: { increment: music.creditsReserved } },
      });

      await updateMusicRecord(music.id, {
        status: 'failed',
        errorMessage: result.error,
        creditsUsed: 0,
      });

      return NextResponse.json({
        id: music.id,
        status: 'failed',
        errorMessage: result.error,
        creditsRefunded: music.creditsReserved,
      });
    }

    // Still processing
    return NextResponse.json({
      id: music.id,
      status: music.status,
      progress: music.progress,
    });
  } catch (error) {
    console.error('Music status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateRemainingTime(createdAt: Date): number {
  const elapsed = (Date.now() - createdAt.getTime()) / 1000;
  // Assume max 5 minutes, return remaining
  const maxTime = 300;
  return Math.max(0, maxTime - elapsed);
}
