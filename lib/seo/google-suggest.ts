/**
 * Google Suggest API Integration
 * Free keyword suggestions from Google Autocomplete
 */

import { SEOLocaleConfig, getLocaleByCode } from './locales';

export interface KeywordSuggestion {
  keyword: string;
  locale: string;
  source: 'google_suggest';
}

export interface SuggestResponse {
  originalKeyword: string;
  locale: SEOLocaleConfig;
  suggestions: string[];
  timestamp: Date;
  error?: string;
}

/**
 * Build Google Suggest URL with locale parameters
 */
function buildSuggestUrl(keyword: string, locale: SEOLocaleConfig): string {
  const params = new URLSearchParams({
    client: 'firefox', // Firefox returns clean JSON
    q: keyword,
    hl: locale.googleHL,
    gl: locale.googleGL,
  });

  return `https://suggestqueries.google.com/complete/search?${params.toString()}`;
}

/**
 * Get keyword suggestions from Google Suggest for a single locale
 */
export async function getGoogleSuggestions(
  keyword: string,
  localeCode: string
): Promise<SuggestResponse> {
  const locale = getLocaleByCode(localeCode);

  if (!locale) {
    return {
      originalKeyword: keyword,
      locale: {
        code: localeCode,
        name: localeCode,
        nativeName: localeCode,
        googleDomain: 'google.com',
        googleHL: 'en',
        googleGL: 'US',
        flag: '🌍',
        isActive: false,
        priority: 99,
      },
      suggestions: [],
      timestamp: new Date(),
      error: `Unknown locale: ${localeCode}`,
    };
  }

  const url = buildSuggestUrl(keyword, locale);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      },
    });

    if (!response.ok) {
      return {
        originalKeyword: keyword,
        locale,
        suggestions: [],
        timestamp: new Date(),
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    // Response format: [query, [suggestions]]
    const suggestions: string[] = Array.isArray(data[1]) ? data[1] : [];

    return {
      originalKeyword: keyword,
      locale,
      suggestions: suggestions.filter(s => s !== keyword), // Remove original keyword
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      originalKeyword: keyword,
      locale,
      suggestions: [],
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get keyword suggestions from multiple locales
 */
export async function getMultiLocaleSuggestions(
  keyword: string,
  localeCodes: string[]
): Promise<Map<string, SuggestResponse>> {
  const results = new Map<string, SuggestResponse>();

  // Process sequentially with small delay to avoid rate limiting
  for (const localeCode of localeCodes) {
    const response = await getGoogleSuggestions(keyword, localeCode);
    results.set(localeCode, response);

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
}

/**
 * Generate question-based keywords
 * Adds common question prefixes in the locale's language
 */
export async function getQuestionKeywords(
  keyword: string,
  localeCode: string
): Promise<string[]> {
  const questionPrefixes: Record<string, string[]> = {
    'en': ['what is', 'how to', 'why is', 'when to', 'where to', 'which', 'can you', 'how does'],
    'pl': ['co to', 'jak', 'dlaczego', 'kiedy', 'gdzie', 'który', 'czy można', 'jak działa'],
    'es': ['qué es', 'cómo', 'por qué', 'cuándo', 'dónde', 'cuál', 'se puede', 'cómo funciona'],
    'fr': ['qu\'est-ce que', 'comment', 'pourquoi', 'quand', 'où', 'quel', 'peut-on', 'comment fonctionne'],
    'de': ['was ist', 'wie', 'warum', 'wann', 'wo', 'welcher', 'kann man', 'wie funktioniert'],
    'it': ['cos\'è', 'come', 'perché', 'quando', 'dove', 'quale', 'si può', 'come funziona'],
  };

  const prefixes = questionPrefixes[localeCode] || questionPrefixes['en'];
  const questions: string[] = [];

  for (const prefix of prefixes) {
    const questionKeyword = `${prefix} ${keyword}`;
    const suggestions = await getGoogleSuggestions(questionKeyword, localeCode);

    if (suggestions.suggestions.length > 0) {
      questions.push(...suggestions.suggestions.slice(0, 3));
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  // Remove duplicates
  return [...new Set(questions)];
}

/**
 * Generate long-tail keyword variations
 * Adds common modifiers to the base keyword
 */
export async function getLongTailKeywords(
  keyword: string,
  localeCode: string
): Promise<string[]> {
  const modifiers: Record<string, string[]> = {
    'en': ['best', 'top', 'free', 'online', 'cheap', 'professional', 'easy', 'fast', 'vs', 'alternative'],
    'pl': ['najlepszy', 'top', 'darmowy', 'online', 'tani', 'profesjonalny', 'łatwy', 'szybki', 'vs', 'alternatywa'],
    'es': ['mejor', 'top', 'gratis', 'online', 'barato', 'profesional', 'fácil', 'rápido', 'vs', 'alternativa'],
    'fr': ['meilleur', 'top', 'gratuit', 'en ligne', 'pas cher', 'professionnel', 'facile', 'rapide', 'vs', 'alternative'],
    'de': ['beste', 'top', 'kostenlos', 'online', 'günstig', 'professionell', 'einfach', 'schnell', 'vs', 'alternative'],
    'it': ['migliore', 'top', 'gratuito', 'online', 'economico', 'professionale', 'facile', 'veloce', 'vs', 'alternativa'],
  };

  const mods = modifiers[localeCode] || modifiers['en'];
  const longTails: string[] = [];

  for (const mod of mods) {
    // Try both prefix and suffix
    const prefixKeyword = `${mod} ${keyword}`;
    const suffixKeyword = `${keyword} ${mod}`;

    const [prefixSuggestions, suffixSuggestions] = await Promise.all([
      getGoogleSuggestions(prefixKeyword, localeCode),
      getGoogleSuggestions(suffixKeyword, localeCode),
    ]);

    if (prefixSuggestions.suggestions.length > 0) {
      longTails.push(...prefixSuggestions.suggestions.slice(0, 2));
    }
    if (suffixSuggestions.suggestions.length > 0) {
      longTails.push(...suffixSuggestions.suggestions.slice(0, 2));
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Remove duplicates
  return [...new Set(longTails)];
}

/**
 * Comprehensive keyword research for a single keyword
 */
export interface KeywordResearchResult {
  keyword: string;
  locale: string;
  suggestions: string[];
  questions: string[];
  longTails: string[];
  allKeywords: string[];
  timestamp: Date;
}

export async function researchKeyword(
  keyword: string,
  localeCode: string
): Promise<KeywordResearchResult> {
  // Get all types of suggestions in parallel where possible
  const [
    basicSuggestions,
    questions,
    longTails,
  ] = await Promise.all([
    getGoogleSuggestions(keyword, localeCode),
    getQuestionKeywords(keyword, localeCode),
    getLongTailKeywords(keyword, localeCode),
  ]);

  // Combine all keywords
  const allKeywords = [
    ...basicSuggestions.suggestions,
    ...questions,
    ...longTails,
  ];

  // Remove duplicates and sort
  const uniqueKeywords = [...new Set(allKeywords)].sort();

  return {
    keyword,
    locale: localeCode,
    suggestions: basicSuggestions.suggestions,
    questions,
    longTails,
    allKeywords: uniqueKeywords,
    timestamp: new Date(),
  };
}
