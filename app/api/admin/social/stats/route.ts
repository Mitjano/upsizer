import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get social media stats
export async function GET() {
  try {
    // Get account stats
    const accounts = await prisma.socialAccount.findMany({
      where: { isActive: true },
      select: {
        platform: true,
        metadata: true,
      },
    });

    // Count accounts by platform
    const accountsByPlatform: Record<string, number> = {};
    let totalFollowers = 0;

    for (const account of accounts) {
      accountsByPlatform[account.platform] =
        (accountsByPlatform[account.platform] || 0) + 1;

      // Sum followers from metadata
      if (account.metadata && typeof account.metadata === "object") {
        const meta = account.metadata as { followers?: number };
        if (meta.followers) {
          totalFollowers += meta.followers;
        }
      }
    }

    // Get post counts
    const [totalPosts, scheduledPosts, publishedPosts] = await Promise.all([
      prisma.socialPost.count(),
      prisma.socialPost.count({ where: { status: "scheduled" } }),
      prisma.socialPost.count({ where: { status: "published" } }),
    ]);

    // Calculate total engagement from published posts
    const engagementStats = await prisma.socialPost.aggregate({
      where: { status: "published" },
      _sum: {
        totalLikes: true,
        totalComments: true,
        totalShares: true,
      },
    });

    const totalEngagement =
      (engagementStats._sum.totalLikes || 0) +
      (engagementStats._sum.totalComments || 0) +
      (engagementStats._sum.totalShares || 0);

    return NextResponse.json({
      totalAccounts: accounts.length,
      totalPosts,
      scheduledPosts,
      publishedPosts,
      totalFollowers,
      totalEngagement,
      accountsByPlatform,
    });
  } catch (error) {
    console.error("Error fetching social stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch social stats" },
      { status: 500 }
    );
  }
}
