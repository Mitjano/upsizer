/**
 * SERP Scraper - Multi-Locale Google Search Results Scraper
 * Uses Puppeteer for JavaScript-rendered results
 */

import { SEOLocaleConfig, getLocaleByCode } from './locales';

// User agents pool for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
];

// SERP result interface
export interface SerpResult {
  position: number;
  url: string;
  title: string;
  snippet: string;
  features: string[]; // featured_snippet, sitelinks, image, video, etc.
  domain: string;
}

export interface SerpResponse {
  keyword: string;
  locale: SEOLocaleConfig;
  totalResults: number;
  results: SerpResult[];
  featuredSnippet?: SerpResult;
  peopleAlsoAsk?: string[];
  relatedSearches?: string[];
  scrapedAt: Date;
  error?: string;
}

// Get random user agent
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Random delay between min and max milliseconds
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Build Google search URL with locale-specific parameters
export function buildGoogleSearchUrl(keyword: string, locale: SEOLocaleConfig): string {
  const baseUrl = `https://www.${locale.googleDomain}/search`;
  const params = new URLSearchParams({
    q: keyword,
    hl: locale.googleHL,    // Interface language
    gl: locale.googleGL,    // Geolocation
    num: '100',             // Results count (max 100)
    pws: '0',               // Disable personalization
    nfpr: '1',              // Disable auto-correction
    filter: '0',            // Don't filter similar results
  });
  return `${baseUrl}?${params.toString()}`;
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Parse SERP HTML (simplified version - works without Puppeteer for basic scraping)
export async function parseGoogleSerp(html: string, keyword: string, locale: SEOLocaleConfig): Promise<SerpResponse> {
  const results: SerpResult[] = [];
  const peopleAlsoAsk: string[] = [];
  const relatedSearches: string[] = [];
  let featuredSnippet: SerpResult | undefined;

  // Basic regex patterns for extracting results
  // Note: These patterns may need adjustment as Google changes their HTML

  // Extract organic results - look for typical Google result structure
  const resultPattern = /<div class="[^"]*g[^"]*"[^>]*>[\s\S]*?<a href="(https?:\/\/[^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<div[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/div>/gi;

  let match;
  let position = 1;

  // Simple extraction (this is a basic implementation)
  // For production, you'd want to use Puppeteer or Playwright for JS-rendered content
  const divPattern = /<div class="[^"]*tF2Cxc[^"]*"[\s\S]*?<a href="([^"]+)"[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<span[^>]*>([^<]+)/gi;

  while ((match = divPattern.exec(html)) !== null && position <= 100) {
    const url = match[1];
    const title = match[2].trim();
    const snippet = match[3].trim();

    if (url && title && !url.includes('google.com')) {
      results.push({
        position,
        url,
        title,
        snippet,
        domain: extractDomain(url),
        features: [],
      });
      position++;
    }
  }

  // Extract "People Also Ask" questions
  const paaPattern = /data-q="([^"]+)"/gi;
  while ((match = paaPattern.exec(html)) !== null) {
    if (!peopleAlsoAsk.includes(match[1])) {
      peopleAlsoAsk.push(match[1]);
    }
  }

  // Extract related searches
  const relatedPattern = /<a[^>]*class="[^"]*related[^"]*"[^>]*>([^<]+)/gi;
  while ((match = relatedPattern.exec(html)) !== null) {
    if (!relatedSearches.includes(match[1])) {
      relatedSearches.push(match[1].trim());
    }
  }

  // Check for featured snippet
  if (html.includes('featured-snippet') || html.includes('kp-blk')) {
    if (results.length > 0) {
      featuredSnippet = { ...results[0], features: ['featured_snippet'] };
    }
  }

  return {
    keyword,
    locale,
    totalResults: results.length,
    results,
    featuredSnippet,
    peopleAlsoAsk: peopleAlsoAsk.slice(0, 8),
    relatedSearches: relatedSearches.slice(0, 8),
    scrapedAt: new Date(),
  };
}

// Scrape SERP using fetch (basic, may get blocked)
export async function scrapeSerpBasic(keyword: string, localeCode: string): Promise<SerpResponse> {
  const locale = getLocaleByCode(localeCode);

  if (!locale) {
    return {
      keyword,
      locale: { code: localeCode, name: localeCode, nativeName: localeCode, googleDomain: 'google.com', googleHL: 'en', googleGL: 'US', flag: '🌍', isActive: false, priority: 99 },
      totalResults: 0,
      results: [],
      scrapedAt: new Date(),
      error: `Unknown locale: ${localeCode}`,
    };
  }

  const url = buildGoogleSearchUrl(keyword, locale);

  try {
    // Add random delay to avoid rate limiting
    await randomDelay(2000, 5000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': `${locale.googleHL},en-US;q=0.5`,
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    });

    if (!response.ok) {
      return {
        keyword,
        locale,
        totalResults: 0,
        results: [],
        scrapedAt: new Date(),
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Check for CAPTCHA
    if (html.includes('captcha') || html.includes('unusual traffic')) {
      return {
        keyword,
        locale,
        totalResults: 0,
        results: [],
        scrapedAt: new Date(),
        error: 'CAPTCHA detected - rate limit exceeded',
      };
    }

    return await parseGoogleSerp(html, keyword, locale);
  } catch (error) {
    return {
      keyword,
      locale,
      totalResults: 0,
      results: [],
      scrapedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Find position of a domain in SERP results
export function findPositionInSerp(results: SerpResult[], targetDomain: string): number | null {
  const normalizedTarget = targetDomain.replace('www.', '').toLowerCase();

  for (const result of results) {
    if (result.domain.toLowerCase().includes(normalizedTarget) ||
        normalizedTarget.includes(result.domain.toLowerCase())) {
      return result.position;
    }
  }

  return null;
}

// Get position change indicator
export function getPositionChange(current: number | null, previous: number | null): {
  change: number;
  direction: 'up' | 'down' | 'stable' | 'new' | 'lost';
} {
  if (current === null && previous === null) {
    return { change: 0, direction: 'stable' };
  }

  if (current === null && previous !== null) {
    return { change: previous, direction: 'lost' };
  }

  if (current !== null && previous === null) {
    return { change: current, direction: 'new' };
  }

  const change = previous! - current!; // Positive = improved (moved up)

  if (change > 0) {
    return { change, direction: 'up' };
  } else if (change < 0) {
    return { change: Math.abs(change), direction: 'down' };
  }

  return { change: 0, direction: 'stable' };
}

// Calculate difficulty score based on SERP results
export function calculateDifficulty(results: SerpResult[], locale: SEOLocaleConfig): number {
  let score = 0;

  // High authority domains that are harder to outrank
  const highAuthorityDomains = [
    'wikipedia.org', 'amazon.com', 'amazon.', 'youtube.com', 'facebook.com',
    'twitter.com', 'linkedin.com', 'instagram.com', 'reddit.com', 'pinterest.com',
    'medium.com', 'quora.com', 'github.com', 'stackoverflow.com', 'forbes.com',
    'nytimes.com', 'bbc.com', 'cnn.com', 'theguardian.com', 'washingtonpost.com',
    'apple.com', 'microsoft.com', 'google.com', 'adobe.com', 'canva.com',
  ];

  // Check top 10 results
  for (const result of results.slice(0, 10)) {
    // High authority domain = harder
    if (highAuthorityDomains.some(d => result.domain.includes(d))) {
      score += 10;
    }

    // Has features = harder
    if (result.features.length > 0) {
      score += 5;
    }

    // Long snippet = likely good content
    if (result.snippet.length > 150) {
      score += 2;
    }
  }

  // Market competitiveness multiplier
  const marketMultipliers: Record<string, number> = {
    'en': 1.3,
    'de': 1.1,
    'fr': 1.0,
    'es': 0.95,
    'it': 0.95,
    'pl': 0.85,
    'pt': 0.9,
    'nl': 0.9,
    'ru': 0.9,
    'ja': 1.1,
    'ko': 1.0,
  };

  const multiplier = marketMultipliers[locale.code] || 1.0;
  score = Math.round(score * multiplier);

  return Math.min(100, score);
}
