/**
 * Google Trends API Integration
 *
 * Uses unofficial Google Trends API to get:
 * - Interest over time (trend direction)
 * - Related queries
 * - Rising queries (breakout keywords)
 * - Regional interest
 */

export interface TrendData {
  keyword: string;
  interestOverTime: number[]; // Last 12 months, 0-100 scale
  averageInterest: number;
  currentInterest: number;
  trend: 'rising' | 'stable' | 'declining';
  trendPercentage: number; // % change
  relatedQueries: string[];
  risingQueries: Array<{
    query: string;
    growth: number | 'Breakout';
  }>;
}

export interface TrendComparison {
  keywords: string[];
  data: Array<{
    keyword: string;
    averageInterest: number;
    trend: 'rising' | 'stable' | 'declining';
  }>;
}

// Google Trends uses specific geo codes
const LOCALE_TO_GEO: Record<string, string> = {
  'en': 'US',
  'en-US': 'US',
  'en-GB': 'GB',
  'pl': 'PL',
  'de': 'DE',
  'fr': 'FR',
  'es': 'ES',
  'it': 'IT',
  'pt': 'PT',
  'nl': 'NL',
  'ru': 'RU',
  'ja': 'JP',
  'ko': 'KR',
  'zh': 'CN',
};

// Category IDs for Google Trends
export const TREND_CATEGORIES = {
  all: 0,
  arts_entertainment: 3,
  autos_vehicles: 47,
  beauty_fitness: 44,
  books_literature: 22,
  business_industrial: 12,
  computers_electronics: 5,
  finance: 7,
  food_drink: 71,
  games: 8,
  health: 45,
  hobbies_leisure: 65,
  home_garden: 11,
  internet_telecom: 13,
  jobs_education: 958,
  law_government: 19,
  news: 16,
  online_communities: 299,
  people_society: 14,
  pets_animals: 66,
  real_estate: 29,
  reference: 533,
  science: 174,
  shopping: 18,
  sports: 20,
  travel: 67,
};

/**
 * Fetch Google Trends data for a keyword
 * Uses the unofficial Google Trends API endpoint
 */
export async function getGoogleTrends(
  keyword: string,
  locale: string = 'en',
  timeRange: string = 'today 12-m' // Last 12 months
): Promise<TrendData | null> {
  try {
    const geo = LOCALE_TO_GEO[locale] || 'US';

    // Google Trends explore endpoint
    const url = new URL('https://trends.google.com/trends/api/explore');
    url.searchParams.set('hl', locale.split('-')[0]);
    url.searchParams.set('tz', '0');
    url.searchParams.set('req', JSON.stringify({
      comparisonItem: [{
        keyword,
        geo,
        time: timeRange,
      }],
      category: 0,
      property: '',
    }));

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Google Trends API error:', response.status);
      return null;
    }

    const text = await response.text();
    // Google Trends returns data with ")]}'" prefix that needs to be removed
    const jsonText = text.replace(/^\)\]\}\'/, '').trim();

    if (!jsonText) {
      return null;
    }

    const data = JSON.parse(jsonText);

    // Extract widget tokens for further requests
    const widgets = data.widgets || [];
    const timelineWidget = widgets.find((w: { id: string }) => w.id === 'TIMESERIES');
    const relatedWidget = widgets.find((w: { id: string }) => w.id === 'RELATED_QUERIES');

    let interestOverTime: number[] = [];
    let relatedQueries: string[] = [];
    let risingQueries: Array<{ query: string; growth: number | 'Breakout' }> = [];

    // Fetch interest over time
    if (timelineWidget?.token) {
      const timelineData = await fetchWidgetData(timelineWidget.token, timelineWidget.request);
      if (timelineData) {
        interestOverTime = extractTimelineData(timelineData);
      }
    }

    // Fetch related queries
    if (relatedWidget?.token) {
      const relatedData = await fetchWidgetData(relatedWidget.token, relatedWidget.request);
      if (relatedData) {
        const extracted = extractRelatedQueries(relatedData);
        relatedQueries = extracted.top;
        risingQueries = extracted.rising;
      }
    }

    // Calculate trend metrics
    const averageInterest = interestOverTime.length > 0
      ? Math.round(interestOverTime.reduce((a, b) => a + b, 0) / interestOverTime.length)
      : 0;

    const currentInterest = interestOverTime.length > 0
      ? interestOverTime[interestOverTime.length - 1]
      : 0;

    const oldInterest = interestOverTime.length >= 3
      ? interestOverTime.slice(0, 3).reduce((a, b) => a + b, 0) / 3
      : averageInterest;

    const recentInterest = interestOverTime.length >= 3
      ? interestOverTime.slice(-3).reduce((a, b) => a + b, 0) / 3
      : currentInterest;

    let trend: 'rising' | 'stable' | 'declining' = 'stable';
    let trendPercentage = 0;

    if (oldInterest > 0) {
      trendPercentage = Math.round(((recentInterest - oldInterest) / oldInterest) * 100);
      if (trendPercentage > 10) trend = 'rising';
      else if (trendPercentage < -10) trend = 'declining';
    }

    return {
      keyword,
      interestOverTime,
      averageInterest,
      currentInterest,
      trend,
      trendPercentage,
      relatedQueries,
      risingQueries,
    };
  } catch (error) {
    console.error('Error fetching Google Trends:', error);
    return null;
  }
}

/**
 * Fetch widget data from Google Trends
 */
async function fetchWidgetData(token: string, request: unknown): Promise<unknown | null> {
  try {
    const url = new URL('https://trends.google.com/trends/api/widgetdata/multiline');
    url.searchParams.set('hl', 'en');
    url.searchParams.set('tz', '0');
    url.searchParams.set('req', JSON.stringify(request));
    url.searchParams.set('token', token);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return null;

    const text = await response.text();
    const jsonText = text.replace(/^\)\]\}\'/, '').trim();
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

/**
 * Extract timeline data from widget response
 */
function extractTimelineData(data: unknown): number[] {
  try {
    const d = data as { default?: { timelineData?: Array<{ value?: number[] }> } };
    const timeline = d?.default?.timelineData || [];
    return timeline.map((point: { value?: number[] }) => point.value?.[0] || 0);
  } catch {
    return [];
  }
}

/**
 * Extract related queries from widget response
 */
function extractRelatedQueries(data: unknown): {
  top: string[];
  rising: Array<{ query: string; growth: number | 'Breakout' }>;
} {
  try {
    const d = data as { default?: { rankedList?: Array<{ rankedKeyword?: Array<{ query?: string; formattedValue?: string }> }> } };
    const lists = d?.default?.rankedList || [];

    const top: string[] = [];
    const rising: Array<{ query: string; growth: number | 'Breakout' }> = [];

    // First list is usually "Top" queries
    if (lists[0]?.rankedKeyword) {
      for (const item of lists[0].rankedKeyword.slice(0, 10)) {
        if (item.query) top.push(item.query);
      }
    }

    // Second list is usually "Rising" queries
    if (lists[1]?.rankedKeyword) {
      for (const item of lists[1].rankedKeyword.slice(0, 10)) {
        if (item.query) {
          const growth = item.formattedValue === 'Breakout'
            ? 'Breakout' as const
            : parseInt(item.formattedValue?.replace(/[^0-9]/g, '') || '0');
          rising.push({ query: item.query, growth });
        }
      }
    }

    return { top, rising };
  } catch {
    return { top: [], rising: [] };
  }
}

/**
 * Compare multiple keywords trends
 */
export async function compareTrends(
  keywords: string[],
  locale: string = 'en'
): Promise<TrendComparison | null> {
  try {
    const geo = LOCALE_TO_GEO[locale] || 'US';

    const url = new URL('https://trends.google.com/trends/api/explore');
    url.searchParams.set('hl', locale.split('-')[0]);
    url.searchParams.set('tz', '0');
    url.searchParams.set('req', JSON.stringify({
      comparisonItem: keywords.slice(0, 5).map(keyword => ({
        keyword,
        geo,
        time: 'today 12-m',
      })),
      category: 0,
      property: '',
    }));

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return null;

    const text = await response.text();
    const jsonText = text.replace(/^\)\]\}\'/, '').trim();
    const data = JSON.parse(jsonText);

    // Process comparison data
    const widgets = data.widgets || [];
    const timelineWidget = widgets.find((w: { id: string }) => w.id === 'TIMESERIES');

    if (!timelineWidget?.token) return null;

    const timelineData = await fetchWidgetData(timelineWidget.token, timelineWidget.request);
    if (!timelineData) return null;

    // Extract data for each keyword
    const result: TrendComparison = {
      keywords,
      data: [],
    };

    const tData = timelineData as { default?: { timelineData?: Array<{ value?: number[] }> } };
    const timeline = tData?.default?.timelineData || [];

    for (let i = 0; i < keywords.length; i++) {
      const values = timeline.map((point: { value?: number[] }) => point.value?.[i] || 0);
      const avg = values.length > 0
        ? Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length)
        : 0;

      const oldAvg = values.slice(0, 3).reduce((a: number, b: number) => a + b, 0) / 3;
      const newAvg = values.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
      const change = oldAvg > 0 ? ((newAvg - oldAvg) / oldAvg) * 100 : 0;

      let trend: 'rising' | 'stable' | 'declining' = 'stable';
      if (change > 10) trend = 'rising';
      else if (change < -10) trend = 'declining';

      result.data.push({
        keyword: keywords[i],
        averageInterest: avg,
        trend,
      });
    }

    return result;
  } catch (error) {
    console.error('Error comparing trends:', error);
    return null;
  }
}

/**
 * Get daily trending searches for a region
 */
export async function getDailyTrends(locale: string = 'en'): Promise<string[]> {
  try {
    const geo = LOCALE_TO_GEO[locale] || 'US';

    const url = new URL('https://trends.google.com/trends/api/dailytrends');
    url.searchParams.set('hl', locale.split('-')[0]);
    url.searchParams.set('tz', '0');
    url.searchParams.set('geo', geo);
    url.searchParams.set('ns', '15');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) return [];

    const text = await response.text();
    const jsonText = text.replace(/^\)\]\}\'/, '').trim();
    const data = JSON.parse(jsonText);

    const trends: string[] = [];
    const days = data?.default?.trendingSearchesDays || [];

    for (const day of days.slice(0, 2)) {
      for (const search of day.trendingSearches?.slice(0, 10) || []) {
        if (search.title?.query) {
          trends.push(search.title.query);
        }
      }
    }

    return trends;
  } catch (error) {
    console.error('Error fetching daily trends:', error);
    return [];
  }
}

/**
 * Estimate search volume category based on Google Trends interest
 * This is a rough estimate since Google Trends doesn't provide actual numbers
 */
export function estimateSearchVolume(averageInterest: number): {
  category: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  estimatedRange: string;
} {
  if (averageInterest >= 80) {
    return { category: 'very_high', estimatedRange: '100K+' };
  } else if (averageInterest >= 60) {
    return { category: 'high', estimatedRange: '10K-100K' };
  } else if (averageInterest >= 40) {
    return { category: 'medium', estimatedRange: '1K-10K' };
  } else if (averageInterest >= 20) {
    return { category: 'low', estimatedRange: '100-1K' };
  } else {
    return { category: 'very_low', estimatedRange: '<100' };
  }
}
