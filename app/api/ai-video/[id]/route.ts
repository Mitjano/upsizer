import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  deleteVideoRecord,
  deleteVideoFile,
  deleteThumbnail,
  cancelGeneration,
  type VideoProvider,
} from '@/lib/ai-video';

// Get video details
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

    const video = await prisma.generatedVideo.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check if user owns the video or it's public
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isOwner = video.userId === user.id;

    if (!isOwner && !video.isPublic) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Increment views for public videos
    if (!isOwner && video.isPublic) {
      await prisma.generatedVideo.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    }

    return NextResponse.json({
      id: video.id,
      prompt: video.prompt,
      model: video.model,
      provider: video.provider,
      duration: video.duration,
      aspectRatio: video.aspectRatio,
      resolution: video.resolution,
      status: video.status,
      videoUrl: video.localPath
        ? '/' + video.localPath.replace(/^\.?\/?(public\/)?/, '')
        : video.videoUrl,
      thumbnailUrl: video.thumbnailPath
        ? '/' + video.thumbnailPath.replace(/^\.?\/?(public\/)?/, '')
        : video.thumbnailUrl,
      fileSize: video.fileSize,
      processingTime: video.processingTime,
      isPublic: video.isPublic,
      likes: video.likes,
      views: video.views,
      isOwner,
      isLiked: video.likedBy.includes(user.id),
      createdAt: video.createdAt,
      completedAt: video.completedAt,
      ...(isOwner && {
        creditsUsed: video.creditsUsed,
        errorMessage: video.errorMessage,
      }),
    });
  } catch (error) {
    console.error('Get video error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete video
export async function DELETE(
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

    // Cancel if still processing
    if (video.status === 'processing' && video.jobId) {
      await cancelGeneration(video.jobId, video.provider as VideoProvider);
    }

    // Delete files
    if (video.localPath) {
      deleteVideoFile(video.localPath);
    }
    if (video.thumbnailPath) {
      deleteThumbnail(video.thumbnailPath);
    }

    // Delete record
    await deleteVideoRecord(id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update video (set public, etc.)
export async function PATCH(
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

    const updateData: Record<string, unknown> = {};

    // Toggle public
    if (typeof body.isPublic === 'boolean') {
      updateData.isPublic = body.isPublic;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const updated = await prisma.generatedVideo.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      isPublic: updated.isPublic,
    });
  } catch (error) {
    console.error('Update video error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
