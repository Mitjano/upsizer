/**
 * Trending Tags API
 * GET - Get trending tags in a category/niche
 * Uses Google Trends-like data from Google Suggest
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoogleSuggestions } from '@/lib/seo/google-suggest';

interface TrendingTag {
  tag: string;
  trendScore: number; // 0-100 estimated popularity
  category: string;
  growth: 'rising' | 'stable' | 'declining';
  relatedTerms: string[];
}

// Seed keywords by category for our niche
const CATEGORY_SEEDS: Record<string, string[]> = {
  'background-removal': [
    'remove background',
    'background remover',
    'transparent background',
    'remove bg',
    'cut out background',
  ],
  'image-upscaling': [
    'upscale image',
    'ai upscaler',
    'enhance image quality',
    'increase image resolution',
    '4k upscale',
  ],
  'photo-editing': [
    'photo editor',
    'edit photos online',
    'ai photo editing',
    'photo enhancement',
    'image editing tool',
  ],
  'ai-tools': [
    'ai image generator',
    'ai photo editor',
    'ai art generator',
    'ai image enhancer',
    'ai background',
  ],
  'general': [
    'free online tools',
    'image tools',
    'photo tools',
    'graphic design',
    'design software',
  ],
};

// Trending modifiers that indicate rising searches
const TRENDING_MODIFIERS = [
  '2024', '2025', 'ai', 'free', 'best', 'online', 'app',
  'no signup', 'instant', 'automatic', 'one click',
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';
    const locale = searchParams.get('locale') || 'en';
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);

    // Get seed keywords for category
    const seeds = CATEGORY_SEEDS[category] || CATEGORY_SEEDS['general'];
    const trendingTags: TrendingTag[] = [];
    const seenTags = new Set<string>();

    // Fetch suggestions for each seed keyword
    for (const seed of seeds.slice(0, 3)) {
      try {
        const suggestions = await getGoogleSuggestions(seed, locale);

        for (const suggestion of suggestions.suggestions) {
          const normalizedTag = suggestion.toLowerCase().trim();

          if (!seenTags.has(normalizedTag) && normalizedTag.length > 3) {
            seenTags.add(normalizedTag);

            // Estimate trend score based on position and modifiers
            let trendScore = 70; // Base score

            // Boost for trending modifiers
            for (const modifier of TRENDING_MODIFIERS) {
              if (normalizedTag.includes(modifier)) {
                trendScore += 10;
                break;
              }
            }

            // Higher position in suggestions = higher score
            const position = suggestions.suggestions.indexOf(suggestion);
            trendScore += Math.max(0, (10 - position) * 2);

            // Cap at 100
            trendScore = Math.min(100, trendScore);

            // Determine growth (simplified heuristic)
            let growth: TrendingTag['growth'] = 'stable';
            if (normalizedTag.includes('2025') || normalizedTag.includes('ai')) {
              growth = 'rising';
            } else if (normalizedTag.includes('2023') || normalizedTag.includes('2022')) {
              growth = 'declining';
            }

            trendingTags.push({
              tag: normalizedTag,
              trendScore,
              category,
              growth,
              relatedTerms: [], // Will be filled below
            });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch {
        // Skip on error
      }
    }

    // Sort by trend score
    trendingTags.sort((a, b) => b.trendScore - a.trendScore);

    // Get related terms for top tags
    for (const tag of trendingTags.slice(0, 5)) {
      try {
        const related = await getGoogleSuggestions(tag.tag, locale);
        tag.relatedTerms = related.suggestions
          .filter(s => s.toLowerCase() !== tag.tag)
          .slice(0, 5);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch {
        // Skip
      }
    }

    // Limit results
    const limitedTags = trendingTags.slice(0, limit);

    // Group by growth
    const byGrowth = {
      rising: limitedTags.filter(t => t.growth === 'rising'),
      stable: limitedTags.filter(t => t.growth === 'stable'),
      declining: limitedTags.filter(t => t.growth === 'declining'),
    };

    return NextResponse.json({
      success: true,
      category,
      locale,
      tags: limitedTags,
      byGrowth,
      stats: {
        total: limitedTags.length,
        rising: byGrowth.rising.length,
        stable: byGrowth.stable.length,
        declining: byGrowth.declining.length,
        averageTrendScore: limitedTags.length > 0
          ? Math.round(limitedTags.reduce((sum, t) => sum + t.trendScore, 0) / limitedTags.length)
          : 0,
      },
      availableCategories: Object.keys(CATEGORY_SEEDS),
    });
  } catch (error) {
    console.error('Error fetching trending tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending tags' },
      { status: 500 }
    );
  }
}
