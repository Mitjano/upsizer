import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserMusic, countUserMusic, getUserMusicStats } from '@/lib/ai-music';

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
    const folderIdParam = searchParams.get('folderId');
    const status = searchParams.get('status') as 'pending' | 'processing' | 'completed' | 'failed' | null;
    const masteringStatus = searchParams.get('masteringStatus') as 'none' | 'pending' | 'processing' | 'completed' | 'failed' | null;
    const orderBy = (searchParams.get('orderBy') || 'createdAt') as 'createdAt' | 'title' | 'duration';
    const order = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
    const search = searchParams.get('search')?.trim();

    // Parse folderId: 'null' -> null (root folder only), empty/undefined -> undefined (all tracks)
    let folderId: string | null | undefined;
    if (folderIdParam === 'null') {
      folderId = null; // Show only tracks without folder
    } else if (folderIdParam && folderIdParam.trim() !== '') {
      folderId = folderIdParam; // Show tracks in specific folder
    } else {
      folderId = undefined; // Show ALL tracks (no folder filter)
    }

    const [tracks, total, stats] = await Promise.all([
      getUserMusic(user.id, {
        folderId,
        status: status || undefined,
        masteringStatus: masteringStatus || undefined,
        limit,
        offset,
        orderBy,
        order,
        search,
      }),
      countUserMusic(user.id, {
        folderId,
        status: status || undefined,
        search,
      }),
      getUserMusicStats(user.id),
    ]);

    // Transform tracks to include proper URLs
    const transformedTracks = tracks.map(track => ({
      ...track,
      audioUrl: track.localPath
        ? '/' + track.localPath.replace(/^\.?\/?(?:public\/)?/, '')
        : track.audioUrl,
      masteredUrl: track.masteredLocalPath
        ? '/' + track.masteredLocalPath.replace(/^\.?\/?(?:public\/)?/, '')
        : track.masteredUrl,
    }));

    return NextResponse.json({
      tracks: transformedTracks,
      total,
      limit,
      offset,
      hasMore: offset + tracks.length < total,
      stats,
    });
  } catch (error) {
    console.error('List music error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
