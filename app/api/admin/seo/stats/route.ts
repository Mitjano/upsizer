/**
 * SEO Stats API
 * GET - Get SEO dashboard statistics
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get basic stats
    const [
      totalKeywords,
      keywordsWithPosition,
      locales,
      recentHistory,
      backlinksCount,
      lastAudit,
    ] = await Promise.all([
      prisma.trackedKeyword.count({ where: { isActive: true } }),
      prisma.trackedKeyword.count({
        where: { isActive: true, currentPosition: { not: null } },
      }),
      prisma.sEOLocale.findMany({
        where: { isActive: true },
        include: {
          _count: { select: { keywords: true } },
        },
        orderBy: { priority: 'asc' },
      }),
      prisma.keywordPositionHistory.findMany({
        orderBy: { checkedAt: 'desc' },
        take: 100,
        include: {
          keyword: {
            select: {
              keyword: true,
              localeCode: true,
              previousPosition: true,
            },
          },
        },
      }),
      prisma.backlink.count({ where: { status: 'active' } }),
      prisma.siteAuditResult.findFirst({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate average position
    const avgPositionResult = await prisma.trackedKeyword.aggregate({
      where: { isActive: true, currentPosition: { not: null } },
      _avg: { currentPosition: true },
    });

    // Position distribution
    const distribution = {
      top3: 0,
      top10: 0,
      top20: 0,
      top50: 0,
      top100: 0,
      notRanking: 0,
    };

    const keywords = await prisma.trackedKeyword.findMany({
      where: { isActive: true },
      select: { currentPosition: true },
    });

    for (const kw of keywords) {
      if (kw.currentPosition === null) {
        distribution.notRanking++;
      } else if (kw.currentPosition <= 3) {
        distribution.top3++;
      } else if (kw.currentPosition <= 10) {
        distribution.top10++;
      } else if (kw.currentPosition <= 20) {
        distribution.top20++;
      } else if (kw.currentPosition <= 50) {
        distribution.top50++;
      } else {
        distribution.top100++;
      }
    }

    // Recent changes
    const recentChanges = {
      improved: 0,
      declined: 0,
      stable: 0,
      new: 0,
      lost: 0,
    };

    for (const history of recentHistory) {
      const current = history.position;
      const previous = history.keyword?.previousPosition;

      if (current === null && previous !== null) {
        recentChanges.lost++;
      } else if (current !== null && previous === null) {
        recentChanges.new++;
      } else if (current !== null && previous !== null) {
        if (current < previous) recentChanges.improved++;
        else if (current > previous) recentChanges.declined++;
        else recentChanges.stable++;
      }
    }

    // Locale stats
    const localeStats = locales.map(l => ({
      code: l.code,
      name: l.name,
      flag: l.flag,
      keywordCount: l._count.keywords,
    }));

    return NextResponse.json({
      overview: {
        totalKeywords,
        keywordsRanking: keywordsWithPosition,
        avgPosition: avgPositionResult._avg.currentPosition
          ? Math.round(avgPositionResult._avg.currentPosition * 10) / 10
          : null,
        activeLocales: locales.length,
        totalBacklinks: backlinksCount,
        lastAuditScore: lastAudit?.overallScore || null,
        lastAuditDate: lastAudit?.createdAt || null,
      },
      distribution,
      recentChanges,
      localeStats,
    });
  } catch (error) {
    console.error('Error fetching SEO stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEO stats' },
      { status: 500 }
    );
  }
}
