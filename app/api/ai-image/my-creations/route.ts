import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail, createUser } from '@/lib/db';
import { getGeneratedImagesByUserId, getUserGenerationStats } from '@/lib/ai-image/db';
import { prisma } from '@/lib/prisma';
import { userEndpointLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';

interface CreationItem {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  outputUrl: string;
  videoUrl?: string;
  prompt: string;
  model: string;
  mode?: string;
  aspectRatio: string;
  width: number;
  height: number;
  duration?: number;
  isPublic: boolean;
  likes: number;
  views: number;
  createdAt: Date | string;
  user: {
    name: string;
    image?: string | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { allowed, resetAt } = userEndpointLimiter.check(identifier);
    if (!allowed) {
      return rateLimitResponse(resetAt);
    }

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get or create user
    let user = await getUserByEmail(session.user.email);
    if (!user) {
      // Auto-create user from session data
      user = await createUser({
        email: session.user.email,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
        role: 'user',
        status: 'active',
        credits: 3, // Default starting credits
        totalUsage: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get all user's images (from JSON storage)
    const allImages = getGeneratedImagesByUserId(user.id);

    // Get all user's videos (from Prisma/PostgreSQL)
    const allVideos = await prisma.generatedVideo.findMany({
      where: {
        userId: user.id,
        status: 'completed',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prompt: true,
        model: true,
        aspectRatio: true,
        duration: true,
        videoUrl: true,
        localPath: true,
        thumbnailUrl: true,
        thumbnailPath: true,
        isPublic: true,
        likes: true,
        views: true,
        createdAt: true,
        userName: true,
      },
    });

    // Convert images to unified format
    const imageItems: CreationItem[] = allImages.map(img => {
      const imageUrl = img.localPath
        ? `/api/ai-image/${img.id}/view`
        : img.outputUrl;

      return {
        id: img.id,
        type: 'image' as const,
        thumbnailUrl: img.thumbnailUrl || imageUrl,
        outputUrl: imageUrl,
        prompt: img.prompt,
        model: img.model,
        mode: img.mode,
        aspectRatio: img.aspectRatio,
        width: img.width,
        height: img.height,
        isPublic: img.isPublic,
        likes: img.likes,
        views: img.views,
        createdAt: img.createdAt,
        user: {
          name: img.userName || session.user?.name || 'You',
          image: img.userImage || session.user?.image,
        },
      };
    });

    // Convert videos to unified format
    const videoItems: CreationItem[] = allVideos.map(video => {
      const videoUrl = video.localPath
        ? '/' + video.localPath.replace(/^\.?\/?(public\/)?/, '')
        : video.videoUrl;
      const thumbnailUrl = video.thumbnailPath
        ? '/' + video.thumbnailPath.replace(/^\.?\/?(public\/)?/, '')
        : video.thumbnailUrl;

      return {
        id: video.id,
        type: 'video' as const,
        thumbnailUrl: thumbnailUrl || '/images/video-placeholder.png',
        outputUrl: thumbnailUrl || '/images/video-placeholder.png',
        videoUrl: videoUrl || undefined,
        prompt: video.prompt,
        model: video.model,
        aspectRatio: video.aspectRatio,
        width: video.aspectRatio === '16:9' ? 1280 : video.aspectRatio === '9:16' ? 720 : 1080,
        height: video.aspectRatio === '16:9' ? 720 : video.aspectRatio === '9:16' ? 1280 : 1080,
        duration: video.duration,
        isPublic: video.isPublic,
        likes: video.likes,
        views: video.views,
        createdAt: video.createdAt,
        user: {
          name: video.userName || session.user?.name || 'You',
          image: session.user?.image,
        },
      };
    });

    // Combine and sort by date (newest first)
    const allCreations = [...imageItems, ...videoItems].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    const total = allCreations.length;

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = allCreations.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    // Get stats
    const stats = getUserGenerationStats(user.id);

    return NextResponse.json({
      images: paginatedItems,
      hasMore,
      total,
      page,
      limit,
      stats: {
        ...stats,
        totalVideos: allVideos.length,
      },
    });
  } catch (error) {
    console.error('My creations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creations' },
      { status: 500 }
    );
  }
}
