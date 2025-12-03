/**
 * SEO Keyword Research API
 * POST - Research keywords using Google Suggest
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getGoogleSuggestions,
  getQuestionKeywords,
  getLongTailKeywords,
  researchKeyword,
} from '@/lib/seo/google-suggest';
import { getLocaleByCode } from '@/lib/seo/locales';

// POST - Research a keyword
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, locales, type = 'full' } = body;

    if (!keyword || !keyword.trim()) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    if (!locales || locales.length === 0) {
      return NextResponse.json(
        { error: 'At least one locale is required' },
        { status: 400 }
      );
    }

    // Validate locales
    const validLocales = locales.filter((l: string) => getLocaleByCode(l));
    if (validLocales.length === 0) {
      return NextResponse.json(
        { error: 'No valid locales provided' },
        { status: 400 }
      );
    }

    const cleanKeyword = keyword.trim().toLowerCase();
    const results: Record<string, {
      locale: string;
      flag: string;
      suggestions: string[];
      questions?: string[];
      longTails?: string[];
      allKeywords?: string[];
      error?: string;
    }> = {};

    // Process each locale
    for (const localeCode of validLocales) {
      const locale = getLocaleByCode(localeCode);
      if (!locale) continue;

      try {
        if (type === 'full') {
          // Full research (slower, more comprehensive)
          const research = await researchKeyword(cleanKeyword, localeCode);
          results[localeCode] = {
            locale: locale.name,
            flag: locale.flag,
            suggestions: research.suggestions,
            questions: research.questions,
            longTails: research.longTails,
            allKeywords: research.allKeywords,
          };
        } else if (type === 'suggestions') {
          // Just basic suggestions (faster)
          const suggestions = await getGoogleSuggestions(cleanKeyword, localeCode);
          results[localeCode] = {
            locale: locale.name,
            flag: locale.flag,
            suggestions: suggestions.suggestions,
            error: suggestions.error,
          };
        } else if (type === 'questions') {
          // Question keywords
          const questions = await getQuestionKeywords(cleanKeyword, localeCode);
          results[localeCode] = {
            locale: locale.name,
            flag: locale.flag,
            suggestions: [],
            questions,
          };
        } else if (type === 'longtail') {
          // Long-tail keywords
          const longTails = await getLongTailKeywords(cleanKeyword, localeCode);
          results[localeCode] = {
            locale: locale.name,
            flag: locale.flag,
            suggestions: [],
            longTails,
          };
        }
      } catch (error) {
        results[localeCode] = {
          locale: locale?.name || localeCode,
          flag: locale?.flag || '🌍',
          suggestions: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // Small delay between locales
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Calculate totals
    const totalKeywords = new Set<string>();
    Object.values(results).forEach(r => {
      r.suggestions.forEach(s => totalKeywords.add(s));
      r.questions?.forEach(q => totalKeywords.add(q));
      r.longTails?.forEach(l => totalKeywords.add(l));
    });

    return NextResponse.json({
      success: true,
      keyword: cleanKeyword,
      results,
      summary: {
        localesSearched: validLocales.length,
        totalUniqueKeywords: totalKeywords.size,
        keywordsByLocale: Object.fromEntries(
          Object.entries(results).map(([locale, data]) => [
            locale,
            (data.suggestions?.length || 0) +
            (data.questions?.length || 0) +
            (data.longTails?.length || 0),
          ])
        ),
      },
    });
  } catch (error) {
    console.error('Error researching keywords:', error);
    return NextResponse.json(
      { error: 'Failed to research keywords' },
      { status: 500 }
    );
  }
}
