/**
 * Keyword Search Volume API
 *
 * Gets search volume data from available sources:
 * 1. Google Ads API (if configured) - accurate numbers
 * 2. Google Trends (fallback) - relative interest + trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoogleTrends, compareTrends, estimateSearchVolume } from '@/lib/seo/google-trends';
import { getKeywordMetrics, isGoogleAdsConfigured, formatSearchVolume } from '@/lib/seo/google-ads-keywords';

export interface KeywordVolumeData {
  keyword: string;
  // Search volume
  searchVolume: number | null; // Actual number if available
  searchVolumeFormatted: string; // "10K", "1.5M", etc.
  searchVolumeCategory: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  // Trend data
  trend: 'rising' | 'stable' | 'declining';
  trendPercentage: number;
  // Competition
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNSPECIFIED';
  competitionIndex: number; // 0-100
  // Source
  source: 'google_ads' | 'google_trends' | 'estimated';
}

// POST - Get volume for multiple keywords
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

    // Limit to 20 keywords per request
    const limitedKeywords = keywords.slice(0, 20);
    const results: KeywordVolumeData[] = [];

    // Check if Google Ads is configured
    const useGoogleAds = isGoogleAdsConfigured();

    if (useGoogleAds) {
      // Use Google Ads API for accurate data
      try {
        const metrics = await getKeywordMetrics(limitedKeywords, locale);

        for (const m of metrics) {
          const volumeEstimate = estimateSearchVolume(
            Math.min(100, Math.round(m.avgMonthlySearches / 10000))
          );

          results.push({
            keyword: m.keyword,
            searchVolume: m.avgMonthlySearches,
            searchVolumeFormatted: formatSearchVolume(m.avgMonthlySearches),
            searchVolumeCategory: volumeEstimate.category,
            trend: determineTrendFromHistory(m.monthlySearchVolumes),
            trendPercentage: calculateTrendPercentage(m.monthlySearchVolumes),
            competition: m.competition,
            competitionIndex: m.competitionIndex,
            source: 'google_ads',
          });
        }

        // For keywords not found in Google Ads, use Trends as fallback
        const foundKeywords = new Set(results.map(r => r.keyword.toLowerCase()));
        const missingKeywords = limitedKeywords.filter(
          k => !foundKeywords.has(k.toLowerCase())
        );

        if (missingKeywords.length > 0) {
          const trendsResults = await getVolumesFromTrends(missingKeywords, locale);
          results.push(...trendsResults);
        }
      } catch (error) {
        console.error('Google Ads API error, falling back to Trends:', error);
        // Fall back to Google Trends
        const trendsResults = await getVolumesFromTrends(limitedKeywords, locale);
        results.push(...trendsResults);
      }
    } else {
      // Use Google Trends only
      const trendsResults = await getVolumesFromTrends(limitedKeywords, locale);
      results.push(...trendsResults);
    }

    // Sort by search volume (estimated or actual)
    results.sort((a, b) => {
      const volA = a.searchVolume || getCategoryValue(a.searchVolumeCategory);
      const volB = b.searchVolume || getCategoryValue(b.searchVolumeCategory);
      return volB - volA;
    });

    return NextResponse.json({
      success: true,
      keywords: results,
      source: useGoogleAds ? 'google_ads' : 'google_trends',
      count: results.length,
    });
  } catch (error) {
    console.error('Error fetching keyword volumes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keyword volumes' },
      { status: 500 }
    );
  }
}

/**
 * Get volumes from Google Trends (fallback)
 */
async function getVolumesFromTrends(
  keywords: string[],
  locale: string
): Promise<KeywordVolumeData[]> {
  const results: KeywordVolumeData[] = [];

  // Use comparison for up to 5 keywords at a time
  const batches = [];
  for (let i = 0; i < keywords.length; i += 5) {
    batches.push(keywords.slice(i, i + 5));
  }

  for (const batch of batches) {
    try {
      // Try comparison first for efficiency
      if (batch.length > 1) {
        const comparison = await compareTrends(batch, locale);
        if (comparison) {
          for (const data of comparison.data) {
            const volumeEstimate = estimateSearchVolume(data.averageInterest);
            results.push({
              keyword: data.keyword,
              searchVolume: null, // Trends doesn't give actual numbers
              searchVolumeFormatted: volumeEstimate.estimatedRange,
              searchVolumeCategory: volumeEstimate.category,
              trend: data.trend,
              trendPercentage: 0, // Not available in comparison
              competition: 'UNSPECIFIED',
              competitionIndex: 50, // Default middle value
              source: 'google_trends',
            });
          }
          continue;
        }
      }

      // Fall back to individual queries
      for (const keyword of batch) {
        const trendData = await getGoogleTrends(keyword, locale);

        if (trendData) {
          const volumeEstimate = estimateSearchVolume(trendData.averageInterest);
          results.push({
            keyword,
            searchVolume: null,
            searchVolumeFormatted: volumeEstimate.estimatedRange,
            searchVolumeCategory: volumeEstimate.category,
            trend: trendData.trend,
            trendPercentage: trendData.trendPercentage,
            competition: 'UNSPECIFIED',
            competitionIndex: 50,
            source: 'google_trends',
          });
        } else {
          // No data available - provide estimate
          results.push({
            keyword,
            searchVolume: null,
            searchVolumeFormatted: 'N/A',
            searchVolumeCategory: 'low',
            trend: 'stable',
            trendPercentage: 0,
            competition: 'UNSPECIFIED',
            competitionIndex: 50,
            source: 'estimated',
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Error fetching trends for batch:', error);
      // Add estimated data for failed keywords
      for (const keyword of batch) {
        if (!results.find(r => r.keyword === keyword)) {
          results.push({
            keyword,
            searchVolume: null,
            searchVolumeFormatted: 'N/A',
            searchVolumeCategory: 'low',
            trend: 'stable',
            trendPercentage: 0,
            competition: 'UNSPECIFIED',
            competitionIndex: 50,
            source: 'estimated',
          });
        }
      }
    }
  }

  return results;
}

/**
 * Determine trend from monthly search history
 */
function determineTrendFromHistory(
  history: Array<{ year: number; month: number; monthlySearches: number }>
): 'rising' | 'stable' | 'declining' {
  if (!history || history.length < 3) return 'stable';

  const recent = history.slice(-3);
  const old = history.slice(0, 3);

  const recentAvg = recent.reduce((a, b) => a + b.monthlySearches, 0) / recent.length;
  const oldAvg = old.reduce((a, b) => a + b.monthlySearches, 0) / old.length;

  if (oldAvg === 0) return 'stable';

  const change = ((recentAvg - oldAvg) / oldAvg) * 100;

  if (change > 15) return 'rising';
  if (change < -15) return 'declining';
  return 'stable';
}

/**
 * Calculate trend percentage from monthly history
 */
function calculateTrendPercentage(
  history: Array<{ year: number; month: number; monthlySearches: number }>
): number {
  if (!history || history.length < 3) return 0;

  const recent = history.slice(-3);
  const old = history.slice(0, 3);

  const recentAvg = recent.reduce((a, b) => a + b.monthlySearches, 0) / recent.length;
  const oldAvg = old.reduce((a, b) => a + b.monthlySearches, 0) / old.length;

  if (oldAvg === 0) return 0;

  return Math.round(((recentAvg - oldAvg) / oldAvg) * 100);
}

/**
 * Get numeric value for category (for sorting)
 */
function getCategoryValue(category: string): number {
  switch (category) {
    case 'very_high': return 100000;
    case 'high': return 10000;
    case 'medium': return 1000;
    case 'low': return 100;
    case 'very_low': return 10;
    default: return 0;
  }
}
