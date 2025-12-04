/**
 * Content Ideas Generator API
 * POST - Generate article ideas for a keyword/niche
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';
import { scrapeSerpBasic } from '@/lib/seo/serp-scraper';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ArticleIdea {
  title: string;
  slug: string;
  type: 'how-to' | 'listicle' | 'comparison' | 'guide' | 'review' | 'case-study' | 'tutorial' | 'faq';
  targetKeyword: string;
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  searchIntent: 'informational' | 'transactional' | 'navigational' | 'commercial';
  outline: string[];
  estimatedWordCount: number;
  potentialQuestions: string[];
  relatedTopics: string[];
}

const IDEA_GENERATION_PROMPT = `You are an expert SEO content strategist. Generate comprehensive article ideas for a website about AI image editing tools (background removal, upscaling, image enhancement).

For each article idea, provide:
1. A compelling, SEO-optimized title
2. URL-friendly slug
3. Content type (how-to, listicle, comparison, guide, review, case-study, tutorial, faq)
4. Target keyword
5. Difficulty to rank (easy/medium/hard)
6. Search intent (informational/transactional/navigational/commercial)
7. Brief outline (5-8 key points)
8. Estimated word count
9. Questions readers might have
10. Related topics to cover

Return JSON:
{
  "ideas": [
    {
      "title": "How to Remove Background from Product Photos in 2025",
      "slug": "remove-background-product-photos-guide",
      "type": "how-to",
      "targetKeyword": "remove background product photos",
      "estimatedDifficulty": "medium",
      "searchIntent": "informational",
      "outline": ["Introduction", "Why background matters", "Step 1...", "Step 2...", "Tips", "Conclusion"],
      "estimatedWordCount": 2000,
      "potentialQuestions": ["What is the best tool?", "How long does it take?"],
      "relatedTopics": ["transparent background", "ecommerce photography"]
    }
  ]
}`;

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

// Get Google suggestions for related topics
async function getRelatedSuggestions(keyword: string, locale: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}&hl=${locale}`
    );
    const data = await response.json();
    return data[1] || [];
  } catch {
    return [];
  }
}

// Get "People Also Ask" style questions
async function getPeopleAlsoAsk(keyword: string): Promise<string[]> {
  const questionPrefixes = ['how to', 'what is', 'why', 'can you', 'is it possible to', 'best way to'];
  const questions: string[] = [];

  for (const prefix of questionPrefixes.slice(0, 3)) {
    try {
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(`${prefix} ${keyword}`)}`
      );
      const data = await response.json();
      if (data[1]) {
        questions.push(...data[1].slice(0, 2));
      }
    } catch {
      continue;
    }
  }

  return [...new Set(questions)].slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, locale = 'en', count = 10, niche } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Gather context in parallel
    const [suggestions, questions, serpResults] = await Promise.all([
      getRelatedSuggestions(keyword, locale),
      getPeopleAlsoAsk(keyword),
      scrapeSerpBasic(keyword, locale).catch(() => ({ results: [] })),
    ]);

    // Analyze competitor content types
    const competitorTitles = serpResults.results?.slice(0, 5).map(r => r.title) || [];

    // Generate ideas with AI
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: IDEA_GENERATION_PROMPT },
        {
          role: 'user',
          content: `Generate ${count} article ideas for:
Keyword: "${keyword}"
Niche: ${niche || 'AI image editing tools (Pixelift)'}
Locale: ${locale}

Context from Google:
- Related searches: ${suggestions.slice(0, 10).join(', ')}
- Common questions: ${questions.slice(0, 10).join(', ')}
- Competitor titles: ${competitorTitles.join(', ')}

Focus on:
1. High search potential topics
2. Topics we can rank for (low-medium difficulty)
3. Content that solves real user problems
4. Evergreen content that stays relevant`,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const aiContent = aiResponse.choices[0]?.message?.content;
    let ideas: ArticleIdea[] = [];

    if (aiContent) {
      const parsed = JSON.parse(aiContent);
      ideas = (parsed.ideas || []).map((idea: ArticleIdea) => ({
        ...idea,
        slug: idea.slug || generateSlug(idea.title),
      }));
    }

    return NextResponse.json({
      success: true,
      keyword,
      locale,
      ideas,
      context: {
        relatedSearches: suggestions.slice(0, 10),
        questions: questions.slice(0, 10),
        competitorCount: competitorTitles.length,
      },
    });
  } catch (error) {
    console.error('Error generating content ideas:', error);
    return NextResponse.json(
      { error: 'Failed to generate content ideas' },
      { status: 500 }
    );
  }
}
