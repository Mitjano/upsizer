/**
 * Keyword Difficulty API
 * POST - Calculate difficulty scores for keywords
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { scrapeSerpBasic, calculateDifficulty } from '@/lib/seo/serp-scraper';
import { getLocaleByCode } from '@/lib/seo/locales';

// Enhanced difficulty calculation with multiple factors
interface DifficultyResult {
  keyword: string;
  locale: string;
  difficulty: number;  // 0-100
  difficultyLabel: 'easy' | 'medium' | 'hard' | 'very_hard';
  factors: {
    serpCompetition: number;      // Based on top 10 domains
    contentQuality: number;       // Based on snippet lengths
    serpFeatures: number;         // Featured snippets, PAA, etc.
    marketCompetitiveness: number; // EN is harder than PL
    totalResults: number;         // Estimated total results
  };
  topDomains: string[];  // Top 5 domains in SERP
  hasFeatures: string[]; // featured_snippet, people_also_ask, etc.
  estimatedEffort: string; // "Low", "Medium", "High", "Very High"
  recommendation: string;
}

// High authority domains - harder to outrank
const HIGH_AUTHORITY_DOMAINS = [
  'wikipedia.org', 'amazon.com', 'amazon.', 'youtube.com', 'facebook.com',
  'twitter.com', 'linkedin.com', 'instagram.com', 'reddit.com', 'pinterest.com',
  'medium.com', 'quora.com', 'github.com', 'stackoverflow.com', 'forbes.com',
  'nytimes.com', 'bbc.com', 'cnn.com', 'theguardian.com', 'washingtonpost.com',
  'apple.com', 'microsoft.com', 'google.com', 'adobe.com', 'canva.com',
  'shutterstock.com', 'gettyimages.com', 'pexels.com', 'unsplash.com',
  'photoshop.com', 'remove.bg', 'removebg.com', 'photoroom.com',
];

// Market competitiveness multipliers
const MARKET_MULTIPLIERS: Record<string, number> = {
  'en': 1.4,   // English - most competitive
  'de': 1.2,   // German - very competitive
  'fr': 1.1,   // French - competitive
  'es': 1.0,   // Spanish - moderate
  'it': 0.95,  // Italian - moderate
  'pt': 0.9,   // Portuguese - moderate
  'nl': 0.9,   // Dutch - moderate
  'pl': 0.8,   // Polish - less competitive
  'ru': 0.85,  // Russian - moderate
  'ja': 1.15,  // Japanese - competitive
  'ko': 1.0,   // Korean - moderate
  'zh': 1.1,   // Chinese - competitive
  'ar': 0.85,  // Arabic - less competitive
  'tr': 0.85,  // Turkish - less competitive
  'vi': 0.8,   // Vietnamese - less competitive
  'th': 0.8,   // Thai - less competitive
  'id': 0.8,   // Indonesian - less competitive
};

function calculateEnhancedDifficulty(
  keyword: string,
  serp: Awaited<ReturnType<typeof scrapeSerpBasic>>,
  localeCode: string
): DifficultyResult {
  const locale = getLocaleByCode(localeCode)!;
  const results = serp.results;

  // Factor 1: SERP Competition (0-40 points)
  let serpCompetition = 0;
  const topDomains: string[] = [];

  for (const result of results.slice(0, 10)) {
    topDomains.push(result.domain);

    // Check for high authority domains
    if (HIGH_AUTHORITY_DOMAINS.some(d => result.domain.includes(d))) {
      serpCompetition += 4;
    } else {
      // Even non-authority domains add some competition
      serpCompetition += 1;
    }
  }
  serpCompetition = Math.min(40, serpCompetition);

  // Factor 2: Content Quality (0-20 points)
  let contentQuality = 0;
  for (const result of results.slice(0, 10)) {
    if (result.snippet.length > 200) {
      contentQuality += 2;
    } else if (result.snippet.length > 100) {
      contentQuality += 1;
    }
  }
  contentQuality = Math.min(20, contentQuality);

  // Factor 3: SERP Features (0-20 points)
  let serpFeatures = 0;
  const hasFeatures: string[] = [];

  if (serp.featuredSnippet) {
    serpFeatures += 8;
    hasFeatures.push('featured_snippet');
  }

  if (serp.peopleAlsoAsk && serp.peopleAlsoAsk.length > 0) {
    serpFeatures += 5;
    hasFeatures.push('people_also_ask');
  }

  if (serp.relatedSearches && serp.relatedSearches.length > 0) {
    serpFeatures += 3;
    hasFeatures.push('related_searches');
  }

  // Check for video/image results in top 10
  const hasVideoOrImage = results.slice(0, 10).some(r =>
    r.url.includes('youtube.com') || r.features.includes('video') || r.features.includes('image')
  );
  if (hasVideoOrImage) {
    serpFeatures += 4;
    hasFeatures.push('video_results');
  }

  serpFeatures = Math.min(20, serpFeatures);

  // Factor 4: Market Competitiveness (0-20 points)
  const multiplier = MARKET_MULTIPLIERS[localeCode] || 1.0;
  const marketCompetitiveness = Math.round(15 * multiplier);

  // Calculate raw score (0-100)
  let rawScore = serpCompetition + contentQuality + serpFeatures + marketCompetitiveness;

  // If we got very few results, it might be an easy keyword
  if (results.length < 5) {
    rawScore = Math.max(10, rawScore - 30);
  }

  // If there was an error (CAPTCHA, etc.), estimate based on market
  if (serp.error) {
    rawScore = Math.round(50 * multiplier); // Estimate moderate difficulty
  }

  const difficulty = Math.min(100, Math.max(0, rawScore));

  // Determine labels
  let difficultyLabel: DifficultyResult['difficultyLabel'];
  let estimatedEffort: string;
  let recommendation: string;

  if (difficulty <= 30) {
    difficultyLabel = 'easy';
    estimatedEffort = 'Low';
    recommendation = 'Good opportunity! Create quality content and you can rank quickly.';
  } else if (difficulty <= 50) {
    difficultyLabel = 'medium';
    estimatedEffort = 'Medium';
    recommendation = 'Achievable with well-optimized content and some backlinks.';
  } else if (difficulty <= 70) {
    difficultyLabel = 'hard';
    estimatedEffort = 'High';
    recommendation = 'Requires high-quality content, strong backlinks, and patience.';
  } else {
    difficultyLabel = 'very_hard';
    estimatedEffort = 'Very High';
    recommendation = 'Very competitive. Consider long-tail variations or niche angles.';
  }

  return {
    keyword,
    locale: localeCode,
    difficulty,
    difficultyLabel,
    factors: {
      serpCompetition,
      contentQuality,
      serpFeatures,
      marketCompetitiveness,
      totalResults: results.length,
    },
    topDomains: topDomains.slice(0, 5),
    hasFeatures,
    estimatedEffort,
    recommendation,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keywords, locale = 'en' } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    // Limit to 10 keywords per request to avoid rate limiting
    const keywordsToCheck = keywords.slice(0, 10);

    const results: DifficultyResult[] = [];

    for (const keyword of keywordsToCheck) {
      if (!keyword || typeof keyword !== 'string') continue;

      try {
        // Scrape SERP for this keyword
        const serp = await scrapeSerpBasic(keyword.trim(), locale);

        // Calculate enhanced difficulty
        const difficultyResult = calculateEnhancedDifficulty(keyword.trim(), serp, locale);
        results.push(difficultyResult);

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        // If individual keyword fails, add with estimated difficulty
        results.push({
          keyword: keyword.trim(),
          locale,
          difficulty: 50, // Default to medium
          difficultyLabel: 'medium',
          factors: {
            serpCompetition: 0,
            contentQuality: 0,
            serpFeatures: 0,
            marketCompetitiveness: Math.round(15 * (MARKET_MULTIPLIERS[locale] || 1.0)),
            totalResults: 0,
          },
          topDomains: [],
          hasFeatures: [],
          estimatedEffort: 'Unknown',
          recommendation: 'Could not analyze SERP. Try again later.',
        });
      }
    }

    // Summary statistics
    const avgDifficulty = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.difficulty, 0) / results.length)
      : 0;

    const distribution = {
      easy: results.filter(r => r.difficultyLabel === 'easy').length,
      medium: results.filter(r => r.difficultyLabel === 'medium').length,
      hard: results.filter(r => r.difficultyLabel === 'hard').length,
      very_hard: results.filter(r => r.difficultyLabel === 'very_hard').length,
    };

    return NextResponse.json({
      success: true,
      locale,
      results,
      summary: {
        totalAnalyzed: results.length,
        averageDifficulty: avgDifficulty,
        distribution,
        easiest: results.reduce((min, r) => r.difficulty < min.difficulty ? r : min, results[0]),
        hardest: results.reduce((max, r) => r.difficulty > max.difficulty ? r : max, results[0]),
      },
    });
  } catch (error) {
    console.error('Error calculating keyword difficulty:', error);
    return NextResponse.json(
      { error: 'Failed to calculate keyword difficulty' },
      { status: 500 }
    );
  }
}
