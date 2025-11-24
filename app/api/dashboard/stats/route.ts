import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail, getUsageByUserId } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all usage records for this user
    const usageRecords = getUsageByUserId(user.id);

    // Calculate statistics
    const totalImages = usageRecords.length;

    // Count by tool type
    const upscalerCount = usageRecords.filter(u => u.type === 'upscale').length;
    const bgRemovalCount = usageRecords.filter(u => u.type === 'background-removal').length;

    // Calculate credits used per tool
    const upscalerCredits = usageRecords
      .filter(u => u.type === 'upscale')
      .reduce((sum, u) => sum + u.creditsUsed, 0);

    const bgRemovalCredits = usageRecords
      .filter(u => u.type === 'background-removal')
      .reduce((sum, u) => sum + u.creditsUsed, 0);

    // Determine most used tool
    let mostUsedTool = 'None';
    if (upscalerCount > 0 || bgRemovalCount > 0) {
      mostUsedTool = upscalerCount >= bgRemovalCount
        ? 'Image Upscaler'
        : 'Background Remover';
    }

    // Get recent activity (last 10 items)
    const recentActivity = usageRecords
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(usage => ({
        id: usage.id,
        type: usage.type === 'upscale' ? 'Image Upscaler' : 'Background Remover',
        creditsUsed: usage.creditsUsed,
        date: usage.createdAt,
      }));

    return NextResponse.json({
      totalImages,
      credits: user.credits,
      role: user.role,
      toolsAvailable: 2,
      upscalerUsage: {
        count: upscalerCount,
        credits: upscalerCredits,
      },
      bgRemovalUsage: {
        count: bgRemovalCount,
        credits: bgRemovalCredits,
      },
      mostUsedTool,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
