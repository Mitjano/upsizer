/**
 * SERP Content Analyzer API
 * POST - Analyze top ranking content for a keyword
 * Returns benchmarks and patterns from competitors
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { scrapeSerpBasic, SerpResponse } from '@/lib/seo/serp-scraper';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SERPAnalysisResult {
  keyword: string;
  locale: string;

  // Benchmarks from top results
  benchmarks: {
    avgWordCount: number;
    wordCountRange: { min: number; max: number };
    avgHeadings: { h2: number; h3: number };
    avgImages: number;
    avgParagraphs: number;
    contentTypes: { type: string; count: number }[];
  };

  // Common patterns
  patterns: {
    commonWords: { word: string; frequency: number }[];
    commonPhrases: { phrase: string; frequency: number }[];
    topicsCovered: string[];
    questionsAnswered: string[];
  };

  // Top competitors
  competitors: {
    url: string;
    title: string;
    position: number;
    domain: string;
    snippet: string;
  }[];

  // Recommendations
  recommendations: string[];
}

// AI prompt for content pattern analysis
const PATTERN_ANALYSIS_PROMPT = `Analyze the given search results for SEO patterns.

Extract:
1. Common words and phrases used across results
2. Topics/subtopics covered by top results
3. Questions that are being answered
4. Content types (article, listicle, how-to, product, etc.)

Return JSON:
{
  "commonWords": [{"word": "remove", "frequency": 8}],
  "commonPhrases": [{"phrase": "remove background", "frequency": 5}],
  "topicsCovered": ["AI technology", "photo editing", "transparent backgrounds"],
  "questionsAnswered": ["How to remove background?", "What is the best tool?"],
  "contentTypes": [{"type": "how-to", "count": 4}, {"type": "listicle", "count": 3}],
  "recommendations": ["Include step-by-step guide", "Add comparison table"]
}`;

// Estimate word count from snippet (rough approximation)
function estimateWordCount(snippet: string): number {
  // Typical article is 10-20x snippet length
  const snippetWords = snippet.split(/\s+/).length;
  return snippetWords * 15; // Rough estimate
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, locale = 'en', limit = 10 } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Scrape SERP results
    const serpResults: SerpResponse = await scrapeSerpBasic(keyword, locale);

    if (!serpResults.results || serpResults.results.length === 0) {
      return NextResponse.json(
        { error: 'No search results found' },
        { status: 404 }
      );
    }

    // Extract competitors
    const competitors = serpResults.results.slice(0, Math.min(limit, 10)).map((result) => ({
      url: result.url,
      title: result.title,
      position: result.position,
      domain: extractDomain(result.url),
      snippet: result.snippet,
    }));

    // Estimate benchmarks from snippets
    const wordCounts = competitors.map(c => estimateWordCount(c.snippet));
    const avgWordCount = Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length);

    // Initial benchmarks
    let benchmarks = {
      avgWordCount,
      wordCountRange: { min: Math.min(...wordCounts), max: Math.max(...wordCounts) },
      avgHeadings: { h2: 5, h3: 8 }, // Default estimates
      avgImages: 4,
      avgParagraphs: 15,
      contentTypes: [] as { type: string; count: number }[],
    };

    // Initial patterns
    let patterns = {
      commonWords: [] as { word: string; frequency: number }[],
      commonPhrases: [] as { phrase: string; frequency: number }[],
      topicsCovered: [] as string[],
      questionsAnswered: [] as string[],
    };

    let recommendations: string[] = [];

    // AI analysis for patterns
    try {
      const snippetsText = competitors
        .map((c, i) => `${i + 1}. ${c.title}\n${c.snippet}`)
        .join('\n\n');

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: PATTERN_ANALYSIS_PROMPT },
          {
            role: 'user',
            content: `Keyword: ${keyword}\nLocale: ${locale}\n\nTop Search Results:\n${snippetsText}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const aiContent = aiResponse.choices[0]?.message?.content;
      if (aiContent) {
        const parsed = JSON.parse(aiContent);

        patterns = {
          commonWords: (parsed.commonWords || []).slice(0, 20),
          commonPhrases: (parsed.commonPhrases || []).slice(0, 15),
          topicsCovered: parsed.topicsCovered || [],
          questionsAnswered: parsed.questionsAnswered || [],
        };

        benchmarks.contentTypes = parsed.contentTypes || [];
        recommendations = parsed.recommendations || [];
      }
    } catch (aiError) {
      console.error('AI pattern analysis failed:', aiError);

      // Fallback: Basic word frequency analysis
      const allText = competitors.map(c => `${c.title} ${c.snippet}`).join(' ').toLowerCase();
      const words = allText.split(/\s+/).filter(w => w.length > 4);
      const wordFreq: Record<string, number> = {};

      for (const word of words) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }

      patterns.commonWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word, frequency]) => ({ word, frequency }));
    }

    // Generate default recommendations if none
    if (recommendations.length === 0) {
      recommendations = [
        `Target ${avgWordCount} words based on top results`,
        'Include detailed step-by-step instructions',
        'Add visual examples and screenshots',
        'Answer common questions in your content',
        'Use a clear heading structure (H2s and H3s)',
      ];
    }

    const result: SERPAnalysisResult = {
      keyword,
      locale,
      benchmarks,
      patterns,
      competitors,
      recommendations,
    };

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error analyzing SERP:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SERP' },
      { status: 500 }
    );
  }
}
