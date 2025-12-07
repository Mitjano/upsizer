import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'failed' | null;

    const whereClause: {
      userId: string;
      status?: 'pending' | 'processing' | 'completed' | 'failed';
    } = {
      userId: user.id,
    };

    if (status) {
      whereClause.status = status;
    }

    const [videos, total] = await Promise.all([
      prisma.generatedVideo.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          prompt: true,
          model: true,
          provider: true,
          duration: true,
          aspectRatio: true,
          resolution: true,
          status: true,
          progress: true,
          videoUrl: true,
          localPath: true,
          thumbnailUrl: true,
          thumbnailPath: true,
          fileSize: true,
          processingTime: true,
          creditsUsed: true,
          isPublic: true,
          likes: true,
          views: true,
          errorMessage: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      prisma.generatedVideo.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      videos: videos.map(video => ({
        ...video,
        videoUrl: video.localPath
          ? '/' + video.localPath.replace(/^\.?\/?(public\/)?/, '')
          : video.videoUrl,
        thumbnailUrl: video.thumbnailPath
          ? '/' + video.thumbnailPath.replace(/^\.?\/?(public\/)?/, '')
          : video.thumbnailUrl,
      })),
      total,
      limit,
      offset,
      hasMore: offset + videos.length < total,
    });
  } catch (error) {
    console.error('List videos error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
