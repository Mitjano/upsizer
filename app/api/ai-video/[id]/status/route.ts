import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  checkGenerationStatus,
  updateVideoRecord,
  downloadAndSaveVideo,
  downloadAndSaveThumbnail,
  type VideoProvider,
} from '@/lib/ai-video';

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

    // Get video record
    const video = await prisma.generatedVideo.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user || video.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // If already completed or failed, return current status
    if (video.status === 'completed' || video.status === 'failed' || video.status === 'cancelled') {
      return NextResponse.json({
        id: video.id,
        status: video.status,
        videoUrl: video.localPath
          ? '/' + video.localPath.replace(/^\.?\/?(public\/)?/, '')
          : video.videoUrl,
        thumbnailUrl: video.thumbnailPath
          ? '/' + video.thumbnailPath.replace(/^\.?\/?(public\/)?/, '')
          : video.thumbnailUrl,
        progress: video.progress,
        errorMessage: video.errorMessage,
        createdAt: video.createdAt,
        completedAt: video.completedAt,
      });
    }

    // Check status with provider
    if (!video.jobId) {
      return NextResponse.json({
        id: video.id,
        status: video.status,
        progress: video.progress,
      });
    }

    const result = await checkGenerationStatus(
      video.jobId,
      video.provider as VideoProvider
    );

    // Update progress
    if (result.status === 'processing') {
      return NextResponse.json({
        id: video.id,
        status: 'processing',
        progress: video.progress,
        estimatedTimeRemaining: calculateRemainingTime(video.createdAt),
      });
    }

    // Handle completion
    if (result.status === 'completed' && result.videoUrl) {
      const startTime = video.createdAt.getTime();
      const processingTime = Math.floor((Date.now() - startTime) / 1000);

      // Download and save video locally
      const videoSaveResult = await downloadAndSaveVideo(result.videoUrl, video.userId);

      let thumbnailPath: string | undefined;
      if (result.thumbnailUrl) {
        const thumbResult = await downloadAndSaveThumbnail(result.thumbnailUrl, video.userId);
        if (thumbResult.success) {
          thumbnailPath = thumbResult.localPath;
        }
      }

      // Update record
      await updateVideoRecord(video.id, {
        status: 'completed',
        progress: 100,
        videoUrl: result.videoUrl,
        localPath: videoSaveResult.localPath,
        thumbnailUrl: result.thumbnailUrl,
        thumbnailPath,
        fileSize: videoSaveResult.fileSize,
        processingTime,
        creditsUsed: video.creditsReserved,
        completedAt: new Date(),
      });

      return NextResponse.json({
        id: video.id,
        status: 'completed',
        videoUrl: videoSaveResult.publicUrl || result.videoUrl,
        thumbnailUrl: thumbnailPath
          ? '/' + thumbnailPath.replace(/^\.?\/?(public\/)?/, '')
          : result.thumbnailUrl,
        progress: 100,
        processingTime,
        completedAt: new Date(),
      });
    }

    // Handle failure
    if (result.status === 'failed') {
      // Refund credits
      await prisma.user.update({
        where: { id: video.userId },
        data: { credits: { increment: video.creditsReserved } },
      });

      await updateVideoRecord(video.id, {
        status: 'failed',
        errorMessage: result.error,
        creditsUsed: 0,
      });

      return NextResponse.json({
        id: video.id,
        status: 'failed',
        errorMessage: result.error,
        creditsRefunded: video.creditsReserved,
      });
    }

    // Still processing
    return NextResponse.json({
      id: video.id,
      status: video.status,
      progress: video.progress,
    });
  } catch (error) {
    console.error('Status check error:', error);
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
