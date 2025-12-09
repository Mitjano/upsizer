import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sort = searchParams.get('sort') || 'trending'; // trending, newest, mostPlayed, mostLiked
    const style = searchParams.get('style'); // filter by style
    const mood = searchParams.get('mood'); // filter by mood

    // Build where clause
    const where: Record<string, unknown> = {
      isPublic: true,
      status: 'completed',
    };

    if (style) {
      where.style = style;
    }

    if (mood) {
      where.mood = mood;
    }

    // Determine ordering based on sort parameter
    let orderBy: Record<string, string>[];
    switch (sort) {
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'mostPlayed':
        orderBy = [{ plays: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'mostLiked':
        orderBy = [{ likes: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'trending':
      default:
        // Trending: combination of likes, plays, and recency
        // We'll fetch more and sort in memory for trending algorithm
        orderBy = [{ createdAt: 'desc' }];
        break;
    }

    // Fetch tracks
    const tracks = await prisma.generatedMusic.findMany({
      where,
      orderBy,
      take: sort === 'trending' ? limit * 3 : limit, // Fetch more for trending to allow re-sorting
      skip: offset,
      select: {
        id: true,
        title: true,
        prompt: true,
        style: true,
        mood: true,
        duration: true,
        instrumental: true,
        audioUrl: true,
        localPath: true,
        coverImageUrl: true,
        isPublic: true,
        plays: true,
        likes: true,
        views: true,
        likedBy: true,
        createdAt: true,
        userName: true,
        userId: true,
      },
    });

    // Apply trending algorithm if needed
    let sortedTracks = tracks;
    if (sort === 'trending') {
      const now = Date.now();
      sortedTracks = tracks
        .map((track) => {
          const hoursSinceCreation = (now - new Date(track.createdAt).getTime()) / (1000 * 60 * 60);
          // Trending score: (likes * 3 + plays) / (hours + 2)^1.5
          // Higher recent engagement = higher score
          const score = (track.likes * 3 + track.plays) / Math.pow(hoursSinceCreation + 2, 1.5);
          return { ...track, trendingScore: score };
        })
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);
    }

    // Get total count
    const total = await prisma.generatedMusic.count({ where });

    // Transform tracks to include proper URLs
    const transformedTracks = sortedTracks.map((track) => ({
      ...track,
      audioUrl: track.localPath
        ? '/' + track.localPath.replace(/^\.?\/?(?:public\/)?/, '')
        : track.audioUrl,
    }));

    return NextResponse.json({
      tracks: transformedTracks,
      total,
      limit,
      offset,
      hasMore: offset + sortedTracks.length < total,
    });
  } catch (error) {
    console.error('Explore music error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
