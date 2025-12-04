import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scrapeSerpBasic } from "@/lib/seo/serp-scraper";

// POST - Auto-discover competitors from SERP results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywordLimit = 20 } = body;

    // Get tracked keywords to analyze
    const keywords = await prisma.trackedKeyword.findMany({
      where: { isActive: true },
      orderBy: { currentPosition: "asc" },
      take: keywordLimit,
    });

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: "No tracked keywords found. Add keywords first." },
        { status: 400 }
      );
    }

    // Track domain appearances
    const domainAppearances = new Map<
      string,
      { count: number; positions: number[]; keywords: string[] }
    >();
    const ourDomain = "pixelift.pl";

    // Get existing competitors to exclude
    const existingCompetitors = await prisma.sEOCompetitor.findMany({
      select: { domain: true },
    });
    const existingDomains = new Set(existingCompetitors.map((c) => c.domain));

    // Analyze SERPs
    for (const kw of keywords) {
      try {
        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const serpResults = await scrapeSerpBasic(kw.keyword, kw.localeCode);

        // Extract domains from top 10 results
        for (const result of serpResults.results.slice(0, 10)) {
          try {
            const url = new URL(result.url);
            let domain = url.hostname.replace(/^www\./, "");

            // Skip our own domain and existing competitors
            if (domain === ourDomain || domain === `www.${ourDomain}`) continue;
            if (existingDomains.has(domain)) continue;

            // Skip common non-competitor domains
            const skipDomains = [
              "youtube.com",
              "facebook.com",
              "twitter.com",
              "instagram.com",
              "linkedin.com",
              "pinterest.com",
              "reddit.com",
              "wikipedia.org",
              "amazon.com",
              "ebay.com",
              "allegro.pl",
              "google.com",
              "bing.com",
            ];
            if (skipDomains.some((d) => domain.includes(d))) continue;

            const existing = domainAppearances.get(domain);
            if (existing) {
              existing.count++;
              existing.positions.push(result.position);
              if (!existing.keywords.includes(kw.keyword)) {
                existing.keywords.push(kw.keyword);
              }
            } else {
              domainAppearances.set(domain, {
                count: 1,
                positions: [result.position],
                keywords: [kw.keyword],
              });
            }
          } catch {
            // Invalid URL, skip
          }
        }
      } catch (error) {
        console.error(`Error analyzing keyword ${kw.keyword}:`, error);
      }
    }

    // Filter domains appearing in 2+ SERPs and sort by frequency
    const potentialCompetitors = [...domainAppearances.entries()]
      .filter(([_, data]) => data.count >= 2)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([domain, data]) => ({
        domain,
        appearances: data.count,
        avgPosition:
          data.positions.reduce((a, b) => a + b, 0) / data.positions.length,
        keywords: data.keywords.slice(0, 5), // Top 5 keywords they rank for
        keywordsCount: data.keywords.length,
      }));

    return NextResponse.json({
      analyzedKeywords: keywords.length,
      potentialCompetitors,
      message: `Found ${potentialCompetitors.length} potential competitors from analyzing ${keywords.length} keywords`,
    });
  } catch (error) {
    console.error("Error discovering competitors:", error);
    return NextResponse.json(
      { error: "Failed to discover competitors" },
      { status: 500 }
    );
  }
}
