/**
 * Keyword Magic API
 * POST - Generate keyword variations from a seed keyword
 * Similar to SEMrush Keyword Magic Tool
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGoogleSuggestions, getQuestionKeywords } from '@/lib/seo/google-suggest';
import { getLocaleByCode } from '@/lib/seo/locales';

// Keyword variation types
interface KeywordVariation {
  keyword: string;
  type: 'suggestion' | 'question' | 'modifier' | 'long_tail' | 'related';
  source: string; // Where it came from
}

interface KeywordGroup {
  name: string;
  keywords: KeywordVariation[];
}

// Common modifiers for keyword expansion
const MODIFIERS = {
  prefix: [
    'best', 'top', 'free', 'cheap', 'online', 'easy', 'fast', 'quick',
    'professional', 'automatic', 'instant', 'simple', 'advanced', 'new',
  ],
  suffix: [
    'app', 'tool', 'software', 'service', 'online', 'free', 'download',
    'tutorial', 'guide', 'tips', 'review', 'alternative', 'comparison',
    '2024', '2025', 'ai', 'pro',
  ],
  intent: {
    how_to: ['how to', 'how do i', 'how can i', 'ways to'],
    what_is: ['what is', 'what are', "what's"],
    why: ['why', 'why is', 'why do'],
    where: ['where to', 'where can i'],
    best: ['best', 'top', 'best free', 'top 10'],
    compare: ['vs', 'versus', 'or', 'compared to', 'alternative to'],
  },
};

// Generate all modifier variations
function generateModifierVariations(keyword: string): KeywordVariation[] {
  const variations: KeywordVariation[] = [];
  const seen = new Set<string>();

  // Prefix variations
  for (const prefix of MODIFIERS.prefix) {
    const variation = `${prefix} ${keyword}`;
    if (!seen.has(variation.toLowerCase())) {
      seen.add(variation.toLowerCase());
      variations.push({
        keyword: variation,
        type: 'modifier',
        source: `prefix: ${prefix}`,
      });
    }
  }

  // Suffix variations
  for (const suffix of MODIFIERS.suffix) {
    const variation = `${keyword} ${suffix}`;
    if (!seen.has(variation.toLowerCase())) {
      seen.add(variation.toLowerCase());
      variations.push({
        keyword: variation,
        type: 'modifier',
        source: `suffix: ${suffix}`,
      });
    }
  }

  // Intent variations
  for (const [intentType, prefixes] of Object.entries(MODIFIERS.intent)) {
    for (const prefix of prefixes) {
      const variation = `${prefix} ${keyword}`;
      if (!seen.has(variation.toLowerCase())) {
        seen.add(variation.toLowerCase());
        variations.push({
          keyword: variation,
          type: 'question',
          source: `intent: ${intentType}`,
        });
      }
    }
  }

  return variations;
}

// Generate alphabet variations (a-z after keyword)
function generateAlphabetVariations(keyword: string): string[] {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  return alphabet.map(letter => `${keyword} ${letter}`);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, locale = 'en', options = {} } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    const localeConfig = getLocaleByCode(locale);
    if (!localeConfig) {
      return NextResponse.json(
        { error: 'Invalid locale' },
        { status: 400 }
      );
    }

    const cleanKeyword = keyword.trim().toLowerCase();
    const allVariations: KeywordVariation[] = [];
    const groups: KeywordGroup[] = [];

    // 1. Generate modifier variations
    const modifierVariations = generateModifierVariations(cleanKeyword);
    groups.push({
      name: 'Modifiers',
      keywords: modifierVariations,
    });
    allVariations.push(...modifierVariations);

    // 2. Get Google Suggestions
    const googleSuggestions = await getGoogleSuggestions(cleanKeyword, locale);
    if (googleSuggestions.suggestions.length > 0) {
      const suggestionVariations = googleSuggestions.suggestions.map(s => ({
        keyword: s,
        type: 'suggestion' as const,
        source: 'Google Suggest',
      }));
      groups.push({
        name: 'Google Suggestions',
        keywords: suggestionVariations,
      });
      allVariations.push(...suggestionVariations);
    }

    // 3. Get Alphabet Variations (Google Autocomplete with a-z)
    if (options.includeAlphabet !== false) {
      const alphabetQueries = generateAlphabetVariations(cleanKeyword);
      const alphabetVariations: KeywordVariation[] = [];

      // Get suggestions for first 5 letters to avoid rate limiting
      for (const query of alphabetQueries.slice(0, 5)) {
        try {
          const suggestions = await getGoogleSuggestions(query, locale);
          for (const s of suggestions.suggestions.slice(0, 3)) {
            if (!allVariations.some(v => v.keyword.toLowerCase() === s.toLowerCase())) {
              alphabetVariations.push({
                keyword: s,
                type: 'long_tail',
                source: `Alphabet: ${query.split(' ').pop()}`,
              });
            }
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch {
          // Skip on error
        }
      }

      if (alphabetVariations.length > 0) {
        groups.push({
          name: 'Long-tail (A-Z)',
          keywords: alphabetVariations,
        });
        allVariations.push(...alphabetVariations);
      }
    }

    // 4. Get Question Keywords
    const questionKeywords = await getQuestionKeywords(cleanKeyword, locale);
    if (questionKeywords.length > 0) {
      const questionVariations = questionKeywords.map(q => ({
        keyword: q,
        type: 'question' as const,
        source: 'Question Keywords',
      }));
      groups.push({
        name: 'Questions',
        keywords: questionVariations,
      });
      allVariations.push(...questionVariations);
    }

    // 5. Get Related Keywords (seed + common terms)
    const relatedTerms = ['image', 'photo', 'picture', 'tool', 'app', 'online'];
    const relatedVariations: KeywordVariation[] = [];

    for (const term of relatedTerms) {
      if (!cleanKeyword.includes(term)) {
        const combined = `${cleanKeyword} ${term}`;
        try {
          const suggestions = await getGoogleSuggestions(combined, locale);
          for (const s of suggestions.suggestions.slice(0, 2)) {
            if (!allVariations.some(v => v.keyword.toLowerCase() === s.toLowerCase())) {
              relatedVariations.push({
                keyword: s,
                type: 'related',
                source: `Related: ${term}`,
              });
            }
          }
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch {
          // Skip on error
        }
      }
    }

    if (relatedVariations.length > 0) {
      groups.push({
        name: 'Related Keywords',
        keywords: relatedVariations,
      });
      allVariations.push(...relatedVariations);
    }

    // Deduplicate all variations
    const uniqueVariations = Array.from(
      new Map(allVariations.map(v => [v.keyword.toLowerCase(), v])).values()
    );

    // Sort by type and then alphabetically
    uniqueVariations.sort((a, b) => {
      const typeOrder = { suggestion: 0, question: 1, modifier: 2, long_tail: 3, related: 4 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.keyword.localeCompare(b.keyword);
    });

    // Statistics
    const stats = {
      total: uniqueVariations.length,
      byType: {
        suggestion: uniqueVariations.filter(v => v.type === 'suggestion').length,
        question: uniqueVariations.filter(v => v.type === 'question').length,
        modifier: uniqueVariations.filter(v => v.type === 'modifier').length,
        long_tail: uniqueVariations.filter(v => v.type === 'long_tail').length,
        related: uniqueVariations.filter(v => v.type === 'related').length,
      },
    };

    return NextResponse.json({
      success: true,
      keyword: cleanKeyword,
      locale,
      variations: uniqueVariations,
      groups,
      stats,
    });
  } catch (error) {
    console.error('Error generating keyword variations:', error);
    return NextResponse.json(
      { error: 'Failed to generate keyword variations' },
      { status: 500 }
    );
  }
}
