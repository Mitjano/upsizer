import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeSerpBasic, findPositionInSerp } from "@/lib/seo/serp-scraper";

// POST - Check competitor positions for tracked keywords
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { competitorId, keywordIds } = body;

    // Get competitor
    const competitor = await prisma.sEOCompetitor.findUnique({
      where: { id: competitorId },
    });

    if (!competitor) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    // Get keywords to check
    let keywords;
    if (keywordIds && keywordIds.length > 0) {
      keywords = await prisma.trackedKeyword.findMany({
        where: { id: { in: keywordIds } },
      });
    } else {
      // Check all tracked keywords
      keywords = await prisma.trackedKeyword.findMany({
        where: { isActive: true },
        take: 50, // Limit to prevent too many requests
      });
    }

    const results: Array<{
      keyword: string;
      localeCode: string;
      position: number | null;
      url: string | null;
    }> = [];

    // Check each keyword
    for (const kw of keywords) {
      try {
        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const serpResults = await scrapeSerpBasic(kw.keyword, kw.localeCode);

        // Find competitor in results using helper function
        const position = findPositionInSerp(serpResults.results, competitor.domain);

        // Find the result with matching domain
        const competitorResult = serpResults.results.find(
          (r) => r.domain.includes(competitor.domain) || competitor.domain.includes(r.domain)
        );

        const url = competitorResult?.url || null;

        // Save ranking
        await prisma.competitorRanking.create({
          data: {
            competitorId: competitor.id,
            keyword: kw.keyword,
            localeCode: kw.localeCode,
            position,
            url,
          },
        });

        results.push({
          keyword: kw.keyword,
          localeCode: kw.localeCode,
          position,
          url,
        });
      } catch (error) {
        console.error(`Error checking keyword ${kw.keyword}:`, error);
        results.push({
          keyword: kw.keyword,
          localeCode: kw.localeCode,
          position: null,
          url: null,
        });
      }
    }

    // Update competitor stats
    const allRankings = await prisma.competitorRanking.findMany({
      where: { competitorId: competitor.id },
      orderBy: { checkedAt: "desc" },
    });

    // Get unique keywords with latest positions
    const latestPositions = new Map<string, number>();
    for (const r of allRankings) {
      const key = `${r.keyword}-${r.localeCode}`;
      if (!latestPositions.has(key) && r.position) {
        latestPositions.set(key, r.position);
      }
    }

    const rankingKeywords = [...latestPositions.values()].filter(
      (p) => p <= 100
    );

    await prisma.sEOCompetitor.update({
      where: { id: competitor.id },
      data: {
        totalKeywords: rankingKeywords.length,
      },
    });

    return NextResponse.json({
      competitorId: competitor.id,
      competitorDomain: competitor.domain,
      checkedKeywords: keywords.length,
      results,
    });
  } catch (error) {
    console.error("Error checking competitor positions:", error);
    return NextResponse.json(
      { error: "Failed to check competitor positions" },
      { status: 500 }
    );
  }
}
