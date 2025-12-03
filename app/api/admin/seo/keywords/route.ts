/**
 * SEO Keywords API
 * GET - List tracked keywords
 * POST - Add new keyword(s)
 * DELETE - Remove keyword
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// GET - List tracked keywords
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale');
    const search = searchParams.get('search');
    const priority = searchParams.get('priority');
    const hasPosition = searchParams.get('hasPosition');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (locale && locale !== 'all') {
      where.localeCode = locale;
    }

    if (search) {
      where.keyword = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (hasPosition === 'true') {
      where.currentPosition = { not: null };
    } else if (hasPosition === 'false') {
      where.currentPosition = null;
    }

    // Get keywords with pagination
    const [keywords, total] = await Promise.all([
      prisma.trackedKeyword.findMany({
        where,
        include: {
          locale: true,
          history: {
            orderBy: { checkedAt: 'desc' },
            take: 7, // Last 7 checks for sparkline
          },
        },
        orderBy: [
          { currentPosition: 'asc' },
          { keyword: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trackedKeyword.count({ where }),
    ]);

    // Calculate stats
    const stats = await prisma.trackedKeyword.aggregate({
      where: { isActive: true },
      _avg: { currentPosition: true },
      _count: { id: true },
    });

    // Get position distribution
    const positionDistribution = await prisma.trackedKeyword.groupBy({
      by: ['currentPosition'],
      where: { isActive: true, currentPosition: { not: null } },
      _count: true,
    });

    // Categorize positions
    const distribution = {
      top3: 0,
      top10: 0,
      top20: 0,
      top50: 0,
      top100: 0,
      notRanking: 0,
    };

    for (const item of positionDistribution) {
      const pos = item.currentPosition!;
      if (pos <= 3) distribution.top3++;
      else if (pos <= 10) distribution.top10++;
      else if (pos <= 20) distribution.top20++;
      else if (pos <= 50) distribution.top50++;
      else distribution.top100++;
    }

    const notRankingCount = await prisma.trackedKeyword.count({
      where: { isActive: true, currentPosition: null },
    });
    distribution.notRanking = notRankingCount;

    return NextResponse.json({
      keywords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: stats._count.id,
        avgPosition: stats._avg.currentPosition ? Math.round(stats._avg.currentPosition * 10) / 10 : null,
        distribution,
      },
    });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

// POST - Add new keyword(s)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      keyword,
      keywords, // For bulk add
      locales, // Array of locale codes
      priority = 'medium',
      tags = [],
      targetUrls = {}, // { localeCode: url }
    } = body;

    // Validate input
    const keywordList = keywords || (keyword ? [keyword] : []);
    if (keywordList.length === 0) {
      return NextResponse.json(
        { error: 'At least one keyword is required' },
        { status: 400 }
      );
    }

    if (!locales || locales.length === 0) {
      return NextResponse.json(
        { error: 'At least one locale is required' },
        { status: 400 }
      );
    }

    // Verify locales exist
    const validLocales = await prisma.sEOLocale.findMany({
      where: { code: { in: locales } },
    });

    if (validLocales.length !== locales.length) {
      return NextResponse.json(
        { error: 'Some locales are invalid' },
        { status: 400 }
      );
    }

    const created: Array<{ keyword: string; locale: string }> = [];
    const skipped: Array<{ keyword: string; locale: string; reason: string }> = [];

    for (const kw of keywordList) {
      const cleanKeyword = kw.trim().toLowerCase();
      if (!cleanKeyword) continue;

      // Generate groupId to link same keyword across locales
      const groupId = nanoid(10);

      for (const localeCode of locales) {
        try {
          await prisma.trackedKeyword.create({
            data: {
              keyword: cleanKeyword,
              localeCode,
              groupId,
              priority,
              tags,
              targetUrl: targetUrls[localeCode] || null,
            },
          });
          created.push({ keyword: cleanKeyword, locale: localeCode });
        } catch (error) {
          // Likely duplicate
          skipped.push({
            keyword: cleanKeyword,
            locale: localeCode,
            reason: 'Already exists',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      skipped: skipped.length,
      details: { created, skipped },
    });
  } catch (error) {
    console.error('Error adding keywords:', error);
    return NextResponse.json(
      { error: 'Failed to add keywords' },
      { status: 500 }
    );
  }
}

// DELETE - Remove keyword
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const groupId = searchParams.get('groupId'); // Delete all in group

    if (!id && !groupId) {
      return NextResponse.json(
        { error: 'Keyword ID or groupId is required' },
        { status: 400 }
      );
    }

    if (groupId) {
      // Delete all keywords in group (across all locales)
      const result = await prisma.trackedKeyword.deleteMany({
        where: { groupId },
      });
      return NextResponse.json({
        success: true,
        deleted: result.count,
      });
    }

    // Delete single keyword
    await prisma.trackedKeyword.delete({
      where: { id: id! },
    });

    return NextResponse.json({ success: true, deleted: 1 });
  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json(
      { error: 'Failed to delete keyword' },
      { status: 500 }
    );
  }
}
