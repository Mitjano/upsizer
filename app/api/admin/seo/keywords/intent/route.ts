/**
 * Keyword Search Intent API
 * POST - Detect search intent for keywords using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Search intent types
export type SearchIntent = 'informational' | 'navigational' | 'transactional' | 'commercial';

export interface IntentResult {
  keyword: string;
  intent: SearchIntent;
  confidence: number; // 0-100
  reasoning: string;
  suggestions: string[]; // Content suggestions for this intent
}

const INTENT_SYSTEM_PROMPT = `You are an SEO expert specializing in search intent analysis.
Analyze the given keywords and determine their search intent.

Search Intent Types:
1. **Informational** - User wants to learn something (how to, what is, guide, tutorial, tips)
   - Keywords: "how to remove background", "what is image upscaling", "best practices for..."
   - Content: Blog posts, guides, tutorials, FAQs

2. **Navigational** - User wants to find a specific website or page
   - Keywords: "photoshop download", "canva login", "remove.bg"
   - Content: Landing pages, brand pages

3. **Transactional** - User wants to buy or take action NOW
   - Keywords: "buy premium plan", "download app", "free trial", "pricing"
   - Content: Product pages, pricing pages, download pages

4. **Commercial** - User is researching before buying (comparing options)
   - Keywords: "best background remover", "photoshop vs gimp", "top 10 image editors", "review"
   - Content: Comparison articles, reviews, best-of lists

For each keyword, respond with JSON in this EXACT format:
{
  "results": [
    {
      "keyword": "the keyword",
      "intent": "informational|navigational|transactional|commercial",
      "confidence": 85,
      "reasoning": "Brief explanation why",
      "suggestions": ["Content suggestion 1", "Content suggestion 2"]
    }
  ]
}

Rules:
- Be accurate and consistent
- Confidence should reflect how clear the intent is (50-100)
- Provide 2-3 actionable content suggestions
- Consider the context of an image editing/AI tool website`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keywords } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords array is required' },
        { status: 400 }
      );
    }

    // Limit to 20 keywords per request
    const keywordsToAnalyze = keywords.slice(0, 20).map(k => k.trim()).filter(Boolean);

    if (keywordsToAnalyze.length === 0) {
      return NextResponse.json(
        { error: 'No valid keywords provided' },
        { status: 400 }
      );
    }

    // Call OpenAI to analyze intents
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: INTENT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze the search intent for these keywords:\n\n${keywordsToAnalyze.map((k, i) => `${i + 1}. ${k}`).join('\n')}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let parsed: { results: IntentResult[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      // If JSON parsing fails, try to extract manually
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    // Validate and normalize results
    const results: IntentResult[] = [];
    for (const keyword of keywordsToAnalyze) {
      const found = parsed.results?.find(
        r => r.keyword.toLowerCase() === keyword.toLowerCase()
      );

      if (found) {
        results.push({
          keyword,
          intent: validateIntent(found.intent),
          confidence: Math.min(100, Math.max(0, found.confidence || 70)),
          reasoning: found.reasoning || 'No reasoning provided',
          suggestions: found.suggestions || getDefaultSuggestions(found.intent),
        });
      } else {
        // Fallback for keywords not in response
        const guessedIntent = guessIntent(keyword);
        results.push({
          keyword,
          intent: guessedIntent,
          confidence: 50,
          reasoning: 'Intent guessed based on keyword patterns',
          suggestions: getDefaultSuggestions(guessedIntent),
        });
      }
    }

    // Summary statistics
    const intentCounts = {
      informational: results.filter(r => r.intent === 'informational').length,
      navigational: results.filter(r => r.intent === 'navigational').length,
      transactional: results.filter(r => r.intent === 'transactional').length,
      commercial: results.filter(r => r.intent === 'commercial').length,
    };

    const avgConfidence = results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)
      : 0;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalAnalyzed: results.length,
        averageConfidence: avgConfidence,
        distribution: intentCounts,
        dominantIntent: Object.entries(intentCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'informational',
      },
    });
  } catch (error) {
    console.error('Error analyzing keyword intent:', error);
    return NextResponse.json(
      { error: 'Failed to analyze keyword intent' },
      { status: 500 }
    );
  }
}

// Validate intent type
function validateIntent(intent: string): SearchIntent {
  const valid: SearchIntent[] = ['informational', 'navigational', 'transactional', 'commercial'];
  if (valid.includes(intent as SearchIntent)) {
    return intent as SearchIntent;
  }
  return 'informational'; // Default
}

// Simple pattern-based intent guessing (fallback)
function guessIntent(keyword: string): SearchIntent {
  const lower = keyword.toLowerCase();

  // Transactional patterns
  if (
    lower.includes('buy') ||
    lower.includes('price') ||
    lower.includes('pricing') ||
    lower.includes('download') ||
    lower.includes('free trial') ||
    lower.includes('coupon') ||
    lower.includes('discount')
  ) {
    return 'transactional';
  }

  // Commercial patterns
  if (
    lower.includes('best') ||
    lower.includes('top') ||
    lower.includes('review') ||
    lower.includes('vs') ||
    lower.includes('comparison') ||
    lower.includes('alternative')
  ) {
    return 'commercial';
  }

  // Navigational patterns
  if (
    lower.includes('login') ||
    lower.includes('sign in') ||
    lower.includes('website') ||
    lower.includes('.com') ||
    lower.includes('official')
  ) {
    return 'navigational';
  }

  // Default to informational
  return 'informational';
}

// Default content suggestions by intent
function getDefaultSuggestions(intent: SearchIntent): string[] {
  switch (intent) {
    case 'informational':
      return [
        'Create a comprehensive guide or tutorial',
        'Write a blog post with step-by-step instructions',
        'Add FAQ section to address common questions',
      ];
    case 'navigational':
      return [
        'Optimize your homepage and landing pages',
        'Ensure brand name appears prominently',
        'Create clear navigation paths',
      ];
    case 'transactional':
      return [
        'Create a dedicated product/pricing page',
        'Add clear call-to-action buttons',
        'Include trust signals and testimonials',
      ];
    case 'commercial':
      return [
        'Write a comparison article vs competitors',
        'Create a "best of" listicle',
        'Include user reviews and case studies',
      ];
    default:
      return ['Create relevant content for this keyword'];
  }
}
