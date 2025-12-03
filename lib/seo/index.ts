/**
 * SEO Module - Main Export
 */

// Locales
export * from './locales';

// SERP Scraper
export * from './serp-scraper';

// Google Suggest
export * from './google-suggest';

// Types
export type { SerpResult, SerpResponse } from './serp-scraper';
export type { KeywordSuggestion, SuggestResponse, KeywordResearchResult } from './google-suggest';
