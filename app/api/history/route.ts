/**
 * Image History API
 * GET /api/history - Get user's image processing history
 * DELETE /api/history - Delete all user's history
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getUserImageHistory,
  deleteUserImageHistory,
  getUserImageStats,
  type ImageProcessingType,
  type ImageProcessingStatus,
} from '@/lib/image-history';
import { userEndpointLimiter, getClientIdentifier, rateLimitResponse } from '@/lib/rate-limit';

/**
 * GET /api/history
 * Get user's image processing history with pagination and filters
 */
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id || session.user.email;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const type = searchParams.get('type') as ImageProcessingType | null;
    const status = searchParams.get('status') as ImageProcessingStatus | null;
    const sortBy = (searchParams.get('sortBy') || 'createdAt') as 'createdAt' | 'completedAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const includeStats = searchParams.get('stats') === 'true';

    // Get history
    const { entries, total } = getUserImageHistory(userId, {
      limit,
      offset,
      type: type || undefined,
      status: status || undefined,
      sortBy,
      sortOrder,
    });

    const response: {
      entries: typeof entries;
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
      stats?: ReturnType<typeof getUserImageStats>;
    } = {
      entries,
      total,
      limit,
      offset,
      hasMore: offset + entries.length < total,
    };

    // Include stats if requested
    if (includeStats) {
      response.stats = getUserImageStats(userId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('History GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get history' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/history
 * Delete all user's image history
 */
export async function DELETE(request: NextRequest) {
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id || session.user.email;
    const deletedCount = deleteUserImageHistory(userId);

    return NextResponse.json({
      message: 'History deleted successfully',
      deletedCount,
    });
  } catch (error) {
    console.error('History DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete history' },
      { status: 500 }
    );
  }
}
