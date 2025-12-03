/**
 * SEO Keywords Position Check API
 * POST - Check positions for keywords
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { scrapeSerpBasic, findPositionInSerp } from '@/lib/seo/serp-scraper';
import { getLocaleByCode } from '@/lib/seo/locales';

const TARGET_DOMAIN = 'pixelift.pl';

// POST - Check position for keyword(s)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keywordId, keywordIds, checkAll } = body;

    // Get keywords to check
    let keywords;

    if (checkAll) {
      // Check all active keywords (limited to prevent timeout)
      keywords = await prisma.trackedKeyword.findMany({
        where: { isActive: true },
        include: { locale: true },
        take: 20, // Limit to prevent timeout
        orderBy: [
          { lastChecked: 'asc' },
          { priority: 'asc' },
        ],
      });
    } else if (keywordIds && keywordIds.length > 0) {
      keywords = await prisma.trackedKeyword.findMany({
        where: { id: { in: keywordIds } },
        include: { locale: true },
      });
    } else if (keywordId) {
      const keyword = await prisma.trackedKeyword.findUnique({
        where: { id: keywordId },
        include: { locale: true },
      });
      keywords = keyword ? [keyword] : [];
    } else {
      return NextResponse.json(
        { error: 'No keywords specified' },
        { status: 400 }
      );
    }

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'No keywords found' },
        { status: 404 }
      );
    }

    const results: Array<{
      keywordId: string;
      keyword: string;
      locale: string;
      oldPosition: number | null;
      newPosition: number | null;
      change: number;
      direction: string;
      url?: string;
      error?: string;
    }> = [];

    // Process each keyword
    for (const kw of keywords) {
      const localeConfig = getLocaleByCode(kw.localeCode);

      if (!localeConfig) {
        results.push({
          keywordId: kw.id,
          keyword: kw.keyword,
          locale: kw.localeCode,
          oldPosition: kw.currentPosition,
          newPosition: null,
          change: 0,
          direction: 'error',
          error: 'Invalid locale',
        });
        continue;
      }

      // Scrape SERP
      const serpResult = await scrapeSerpBasic(kw.keyword, kw.localeCode);

      if (serpResult.error) {
        results.push({
          keywordId: kw.id,
          keyword: kw.keyword,
          locale: kw.localeCode,
          oldPosition: kw.currentPosition,
          newPosition: null,
          change: 0,
          direction: 'error',
          error: serpResult.error,
        });
        continue;
      }

      // Find our position
      const newPosition = findPositionInSerp(serpResult.results, TARGET_DOMAIN);
      const oldPosition = kw.currentPosition;

      // Calculate change
      let change = 0;
      let direction = 'stable';

      if (newPosition === null && oldPosition !== null) {
        direction = 'lost';
        change = oldPosition;
      } else if (newPosition !== null && oldPosition === null) {
        direction = 'new';
        change = newPosition;
      } else if (newPosition !== null && oldPosition !== null) {
        change = oldPosition - newPosition;
        if (change > 0) direction = 'up';
        else if (change < 0) {
          direction = 'down';
          change = Math.abs(change);
        }
      }

      // Get URL that ranks
      const rankingResult = serpResult.results.find(r =>
        r.domain.includes(TARGET_DOMAIN) || TARGET_DOMAIN.includes(r.domain)
      );

      // Update keyword in database
      await prisma.trackedKeyword.update({
        where: { id: kw.id },
        data: {
          previousPosition: oldPosition,
          currentPosition: newPosition,
          lastChecked: new Date(),
          // Update best/worst positions
          bestPosition: newPosition !== null
            ? (kw.bestPosition === null ? newPosition : Math.min(kw.bestPosition, newPosition))
            : kw.bestPosition,
          worstPosition: newPosition !== null
            ? (kw.worstPosition === null ? newPosition : Math.max(kw.worstPosition, newPosition))
            : kw.worstPosition,
        },
      });

      // Add to history
      await prisma.keywordPositionHistory.create({
        data: {
          keywordId: kw.id,
          position: newPosition,
          url: rankingResult?.url,
          title: rankingResult?.title,
          snippet: rankingResult?.snippet,
          features: rankingResult?.features || [],
        },
      });

      results.push({
        keywordId: kw.id,
        keyword: kw.keyword,
        locale: kw.localeCode,
        oldPosition,
        newPosition,
        change,
        direction,
        url: rankingResult?.url,
      });

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    return NextResponse.json({
      success: true,
      checked: results.length,
      results,
      summary: {
        improved: results.filter(r => r.direction === 'up').length,
        declined: results.filter(r => r.direction === 'down').length,
        stable: results.filter(r => r.direction === 'stable').length,
        new: results.filter(r => r.direction === 'new').length,
        lost: results.filter(r => r.direction === 'lost').length,
        errors: results.filter(r => r.direction === 'error').length,
      },
    });
  } catch (error) {
    console.error('Error checking positions:', error);
    return NextResponse.json(
      { error: 'Failed to check positions' },
      { status: 500 }
    );
  }
}
