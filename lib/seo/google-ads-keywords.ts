/**
 * Google Ads Keyword Planner API Integration
 *
 * Provides accurate search volume data from Google Ads API.
 *
 * SETUP REQUIRED:
 * 1. Create Google Cloud project: https://console.cloud.google.com
 * 2. Enable Google Ads API
 * 3. Create OAuth2 credentials (Web application)
 * 4. Create Google Ads account (can be $0 spend)
 * 5. Apply for Developer Token: https://ads.google.com/aw/apicenter
 * 6. Wait for Basic Access approval (3-7 days)
 *
 * Environment variables needed:
 * - GOOGLE_ADS_CLIENT_ID
 * - GOOGLE_ADS_CLIENT_SECRET
 * - GOOGLE_ADS_DEVELOPER_TOKEN
 * - GOOGLE_ADS_REFRESH_TOKEN
 * - GOOGLE_ADS_CUSTOMER_ID (without dashes)
 */

export interface KeywordMetrics {
  keyword: string;
  avgMonthlySearches: number;
  competition: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNSPECIFIED';
  competitionIndex: number; // 0-100
  lowTopOfPageBidMicros: number;
  highTopOfPageBidMicros: number;
  monthlySearchVolumes: Array<{
    year: number;
    month: number;
    monthlySearches: number;
  }>;
}

export interface KeywordIdea {
  keyword: string;
  metrics: KeywordMetrics;
}

export interface KeywordPlannerConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  customerId: string;
}

// Language codes for Google Ads API
const LOCALE_TO_LANGUAGE_ID: Record<string, string> = {
  'en': '1000', // English
  'pl': '1030', // Polish
  'de': '1001', // German
  'fr': '1002', // French
  'es': '1003', // Spanish
  'it': '1004', // Italian
  'pt': '1014', // Portuguese
  'nl': '1010', // Dutch
  'ru': '1031', // Russian
  'ja': '1005', // Japanese
  'ko': '1012', // Korean
  'zh': '1017', // Chinese (Simplified)
};

// Geo target constants for Google Ads (country codes)
const LOCALE_TO_GEO_TARGET: Record<string, string> = {
  'en': '2840', // United States
  'en-US': '2840',
  'en-GB': '2826', // United Kingdom
  'pl': '2616', // Poland
  'de': '2276', // Germany
  'fr': '2250', // France
  'es': '2724', // Spain
  'it': '2380', // Italy
  'pt': '2076', // Brazil
  'nl': '2528', // Netherlands
  'ru': '2643', // Russia
  'ja': '2392', // Japan
  'ko': '2410', // South Korea
  'zh': '2156', // China
};

/**
 * Get OAuth2 access token using refresh token
 */
async function getAccessToken(config: KeywordPlannerConfig): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Failed to get access token:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Get keyword metrics from Google Ads Keyword Planner
 */
export async function getKeywordMetrics(
  keywords: string[],
  locale: string = 'en',
  config?: KeywordPlannerConfig
): Promise<KeywordMetrics[]> {
  // Use environment variables if config not provided
  const cfg: KeywordPlannerConfig = config || {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
  };

  // Check if configured
  if (!cfg.clientId || !cfg.developerToken || !cfg.customerId) {
    console.warn('Google Ads API not configured');
    return [];
  }

  try {
    const accessToken = await getAccessToken(cfg);
    if (!accessToken) {
      return [];
    }

    const languageId = LOCALE_TO_LANGUAGE_ID[locale] || '1000';
    const geoTargetId = LOCALE_TO_GEO_TARGET[locale] || '2840';

    // Google Ads API endpoint
    const url = `https://googleads.googleapis.com/v15/customers/${cfg.customerId}:generateKeywordHistoricalMetrics`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': cfg.developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: keywords.slice(0, 10), // API limit
        language: `languageConstants/${languageId}`,
        geoTargetConstants: [`geoTargetConstants/${geoTargetId}`],
        keywordPlanNetwork: 'GOOGLE_SEARCH',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Ads API error:', errorText);
      return [];
    }

    const data = await response.json();
    const results: KeywordMetrics[] = [];

    for (const result of data.results || []) {
      const metrics = result.keywordMetrics;
      if (!metrics) continue;

      results.push({
        keyword: result.text || '',
        avgMonthlySearches: parseInt(metrics.avgMonthlySearches) || 0,
        competition: metrics.competition || 'UNSPECIFIED',
        competitionIndex: parseInt(metrics.competitionIndex) || 0,
        lowTopOfPageBidMicros: parseInt(metrics.lowTopOfPageBidMicros) || 0,
        highTopOfPageBidMicros: parseInt(metrics.highTopOfPageBidMicros) || 0,
        monthlySearchVolumes: (metrics.monthlySearchVolumes || []).map((m: {
          year: string;
          month: string;
          monthlySearches: string;
        }) => ({
          year: parseInt(m.year),
          month: parseInt(m.month),
          monthlySearches: parseInt(m.monthlySearches) || 0,
        })),
      });
    }

    return results;
  } catch (error) {
    console.error('Error fetching keyword metrics:', error);
    return [];
  }
}

/**
 * Generate keyword ideas from seed keywords
 */
export async function generateKeywordIdeas(
  seedKeywords: string[],
  locale: string = 'en',
  config?: KeywordPlannerConfig
): Promise<KeywordIdea[]> {
  const cfg: KeywordPlannerConfig = config || {
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
  };

  if (!cfg.clientId || !cfg.developerToken || !cfg.customerId) {
    console.warn('Google Ads API not configured');
    return [];
  }

  try {
    const accessToken = await getAccessToken(cfg);
    if (!accessToken) {
      return [];
    }

    const languageId = LOCALE_TO_LANGUAGE_ID[locale] || '1000';
    const geoTargetId = LOCALE_TO_GEO_TARGET[locale] || '2840';

    const url = `https://googleads.googleapis.com/v15/customers/${cfg.customerId}:generateKeywordIdeas`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': cfg.developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywordSeed: {
          keywords: seedKeywords.slice(0, 10),
        },
        language: `languageConstants/${languageId}`,
        geoTargetConstants: [`geoTargetConstants/${geoTargetId}`],
        keywordPlanNetwork: 'GOOGLE_SEARCH',
        includeAdultKeywords: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Ads API error:', errorText);
      return [];
    }

    const data = await response.json();
    const results: KeywordIdea[] = [];

    for (const result of data.results || []) {
      const metrics = result.keywordIdeaMetrics;
      if (!metrics) continue;

      results.push({
        keyword: result.text || '',
        metrics: {
          keyword: result.text || '',
          avgMonthlySearches: parseInt(metrics.avgMonthlySearches) || 0,
          competition: metrics.competition || 'UNSPECIFIED',
          competitionIndex: parseInt(metrics.competitionIndex) || 0,
          lowTopOfPageBidMicros: parseInt(metrics.lowTopOfPageBidMicros) || 0,
          highTopOfPageBidMicros: parseInt(metrics.highTopOfPageBidMicros) || 0,
          monthlySearchVolumes: (metrics.monthlySearchVolumes || []).map((m: {
            year: string;
            month: string;
            monthlySearches: string;
          }) => ({
            year: parseInt(m.year),
            month: parseInt(m.month),
            monthlySearches: parseInt(m.monthlySearches) || 0,
          })),
        },
      });
    }

    // Sort by search volume
    results.sort((a, b) => b.metrics.avgMonthlySearches - a.metrics.avgMonthlySearches);

    return results;
  } catch (error) {
    console.error('Error generating keyword ideas:', error);
    return [];
  }
}

/**
 * Format search volume for display
 */
export function formatSearchVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toString();
}

/**
 * Format CPC from micros
 */
export function formatCPC(micros: number): string {
  const dollars = micros / 1000000;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Check if Google Ads API is configured
 */
export function isGoogleAdsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN
  );
}
