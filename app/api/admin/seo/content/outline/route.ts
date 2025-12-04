/**
 * AI Article Outline Generator API
 * POST - Generate detailed article outline for a topic
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';
import { scrapeSerpBasic } from '@/lib/seo/serp-scraper';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface HeadingStructure {
  type: 'h1' | 'h2' | 'h3';
  text: string;
  keyPoints?: string[];
  suggestedWordCount?: number;
  keywords?: string[];
}

interface ArticleOutline {
  title: string;
  metaDescription: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  estimatedWordCount: number;
  headings: HeadingStructure[];
  introduction: {
    hook: string;
    context: string;
    thesis: string;
  };
  conclusion: {
    summary: string;
    callToAction: string;
  };
  faqSection: {
    question: string;
    answerPoints: string[];
  }[];
  internalLinkOpportunities: string[];
  externalSourcesSuggestions: string[];
}

const OUTLINE_GENERATION_PROMPT = `You are an expert SEO content strategist creating detailed article outlines.

Generate a comprehensive, SEO-optimized article outline that follows best practices:
- Start with a compelling H1 title
- Use H2s for main sections (5-8 sections)
- Use H3s for subsections within H2s
- Include estimated word count per section
- Suggest keywords to include in each section

Return JSON:
{
  "title": "Compelling H1 title with main keyword",
  "metaDescription": "155-160 character meta description with keyword",
  "targetKeyword": "main keyword",
  "secondaryKeywords": ["related", "keywords"],
  "estimatedWordCount": 2500,
  "headings": [
    {
      "type": "h1",
      "text": "Main Title",
      "suggestedWordCount": 0
    },
    {
      "type": "h2",
      "text": "Introduction to Topic",
      "keyPoints": ["Point 1", "Point 2"],
      "suggestedWordCount": 200,
      "keywords": ["key term"]
    },
    {
      "type": "h3",
      "text": "Subsection under H2",
      "keyPoints": ["Detail 1"],
      "suggestedWordCount": 150,
      "keywords": ["sub term"]
    }
  ],
  "introduction": {
    "hook": "Attention-grabbing opening line",
    "context": "Why this topic matters",
    "thesis": "What reader will learn"
  },
  "conclusion": {
    "summary": "Key takeaways",
    "callToAction": "Next step for reader"
  },
  "faqSection": [
    {
      "question": "Common question about topic?",
      "answerPoints": ["Answer point 1", "Answer point 2"]
    }
  ],
  "internalLinkOpportunities": ["Related topic to link to"],
  "externalSourcesSuggestions": ["Authority site to cite"]
}`;

// Get competitor outlines for reference
async function analyzeCompetitorOutlines(keyword: string, locale: string): Promise<string[]> {
  try {
    const serpResults = await scrapeSerpBasic(keyword, locale);
    const outlines: string[] = [];

    for (const result of serpResults.results?.slice(0, 5) || []) {
      outlines.push(`${result.title}: ${result.snippet}`);
    }

    return outlines;
  } catch {
    return [];
  }
}

// Get question suggestions
async function getQuestions(keyword: string): Promise<string[]> {
  const questions: string[] = [];
  const prefixes = ['how to', 'what is', 'why', 'when', 'can I'];

  for (const prefix of prefixes) {
    try {
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(`${prefix} ${keyword}`)}`
      );
      const data = await response.json();
      if (data[1]) {
        questions.push(...data[1].filter((q: string) => q.endsWith('?') || q.includes('how') || q.includes('what')));
      }
    } catch {
      continue;
    }
  }

  return [...new Set(questions)].slice(0, 8);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, title, locale = 'en', contentType = 'guide', targetWordCount = 2000 } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Gather research data in parallel
    const [competitorOutlines, questions] = await Promise.all([
      analyzeCompetitorOutlines(keyword, locale),
      getQuestions(keyword),
    ]);

    // Generate outline with AI
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: OUTLINE_GENERATION_PROMPT },
        {
          role: 'user',
          content: `Create a detailed article outline for:
Keyword: "${keyword}"
${title ? `Suggested title: "${title}"` : ''}
Content type: ${contentType}
Target word count: ${targetWordCount}
Locale: ${locale}

Context about Pixelift:
- AI-powered image editing tool
- Features: background removal, upscaling, image enhancement, colorization, object removal
- Target audience: photographers, e-commerce sellers, designers, marketers

Competitor snippets:
${competitorOutlines.join('\n')}

Common questions people ask:
${questions.join('\n')}

Create an outline that:
1. Answers user search intent thoroughly
2. Is better than competitor content
3. Includes practical, actionable advice
4. Has natural keyword placement
5. Includes FAQ section for featured snippet opportunity`,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const aiContent = aiResponse.choices[0]?.message?.content;
    let outline: ArticleOutline | null = null;

    if (aiContent) {
      outline = JSON.parse(aiContent);
    }

    return NextResponse.json({
      success: true,
      keyword,
      locale,
      outline,
      research: {
        competitorCount: competitorOutlines.length,
        questionsFound: questions.length,
        questions: questions.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Error generating outline:', error);
    return NextResponse.json(
      { error: 'Failed to generate article outline' },
      { status: 500 }
    );
  }
}
