import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail, createUser } from '@/lib/db';
import { getGeneratedImagesByUserId, getUserGenerationStats } from '@/lib/ai-image/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get or create user
    let user = getUserByEmail(session.user.email);
    if (!user) {
      // Auto-create user from session data
      user = createUser({
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

    // Get all user's images
    const allImages = getGeneratedImagesByUserId(user.id);
    const total = allImages.length;

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const images = allImages.slice(startIndex, endIndex);
    const hasMore = endIndex < total;

    // Get stats
    const stats = getUserGenerationStats(user.id);

    return NextResponse.json({
      images: images.map(img => ({
        id: img.id,
        thumbnailUrl: img.thumbnailUrl || img.outputUrl,
        outputUrl: img.outputUrl,
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
      })),
      hasMore,
      total,
      page,
      limit,
      stats,
    });
  } catch (error) {
    console.error('My creations fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creations' },
      { status: 500 }
    );
  }
}
