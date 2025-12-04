/**
 * Tag Recommendation API (VidIQ-style)
 * POST - Recommend tags based on title/content using AI and keyword data
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';
import { getGoogleSuggestions, getQuestionKeywords } from '@/lib/seo/google-suggest';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TagRecommendation {
  tag: string;
  relevancyScore: number; // 0-100
  category: 'highly_relevant' | 'related' | 'trending' | 'low_competition';
  difficulty: 'easy' | 'medium' | 'hard';
  searchIntent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  source: string; // Where this tag came from
}

interface TagGroup {
  name: string;
  icon: string;
  tags: TagRecommendation[];
}

// AI prompt to analyze content and extract relevant tags
const TAG_EXTRACTION_PROMPT = `You are an SEO expert specializing in tag/keyword extraction for blog posts.

Analyze the given title and optional content, then extract:
1. Primary keywords (most important, directly mentioned)
2. Secondary keywords (related concepts)
3. Long-tail variations (specific phrases)
4. Question-based keywords (what users might search)
5. LSI keywords (semantically related terms)

Context: This is for an AI image editing tool website (Pixelift) with features like:
- Background removal
- Image upscaling
- AI photo editing
- Batch processing

For each keyword, estimate:
- relevancy: 0-100 (how relevant to the title)
- difficulty: easy/medium/hard (SEO competition)
- intent: informational/transactional/commercial/navigational

Return JSON format:
{
  "keywords": [
    {
      "keyword": "remove background",
      "relevancy": 95,
      "difficulty": "medium",
      "intent": "transactional",
      "category": "primary"
    }
  ]
}

Rules:
- Extract 20-40 keywords
- Include both English and Polish if the title is in either language
- Prioritize actionable keywords with clear search intent
- Include long-tail keywords (3-5 words)`;

// Calculate difficulty based on simple heuristics
function estimateDifficulty(keyword: string): 'easy' | 'medium' | 'hard' {
  const wordCount = keyword.split(' ').length;

  // Long-tail keywords are usually easier
  if (wordCount >= 4) return 'easy';
  if (wordCount >= 3) return 'medium';

  // Short generic keywords are harder
  return 'hard';
}

// Determine tag category based on relevancy score
function getTagCategory(relevancy: number, isTrending: boolean = false): TagRecommendation['category'] {
  if (isTrending) return 'trending';
  if (relevancy >= 80) return 'highly_relevant';
  if (relevancy >= 60) return 'related';
  return 'low_competition';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, locale = 'en', maxTags = 50 } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const allTags: TagRecommendation[] = [];
    const seenTags = new Set<string>();

    // 1. AI-based keyword extraction
    try {
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: TAG_EXTRACTION_PROMPT },
          {
            role: 'user',
            content: `Title: ${title}\n\n${content ? `Content: ${content.slice(0, 2000)}` : 'No content provided'}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const aiContent = aiResponse.choices[0]?.message?.content;
      if (aiContent) {
        const parsed = JSON.parse(aiContent);
        for (const kw of parsed.keywords || []) {
          const normalizedTag = kw.keyword.toLowerCase().trim();
          if (!seenTags.has(normalizedTag) && normalizedTag.length > 2) {
            seenTags.add(normalizedTag);
            allTags.push({
              tag: normalizedTag,
              relevancyScore: Math.min(100, Math.max(0, kw.relevancy || 70)),
              category: getTagCategory(kw.relevancy || 70),
              difficulty: kw.difficulty || estimateDifficulty(normalizedTag),
              searchIntent: kw.intent || 'informational',
              source: 'AI Analysis',
            });
          }
        }
      }
    } catch (aiError) {
      console.error('AI extraction failed:', aiError);
    }

    // 2. Google Suggest for title words
    const titleWords = title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const mainKeywords = titleWords.slice(0, 3).join(' ');

    if (mainKeywords) {
      try {
        const suggestions = await getGoogleSuggestions(mainKeywords, locale);
        for (const suggestion of suggestions.suggestions.slice(0, 15)) {
          const normalizedTag = suggestion.toLowerCase().trim();
          if (!seenTags.has(normalizedTag) && normalizedTag.length > 2) {
            seenTags.add(normalizedTag);
            // Calculate relevancy based on similarity to title
            const titleLower = title.toLowerCase();
            const wordMatches = normalizedTag.split(' ').filter((w: string) => titleLower.includes(w)).length;
            const totalWords = normalizedTag.split(' ').length;
            const relevancy = Math.round((wordMatches / totalWords) * 80) + 20;

            allTags.push({
              tag: normalizedTag,
              relevancyScore: relevancy,
              category: getTagCategory(relevancy),
              difficulty: estimateDifficulty(normalizedTag),
              searchIntent: 'informational',
              source: 'Google Suggest',
            });
          }
        }
      } catch {
        // Skip on error
      }
    }

    // 3. Question keywords
    if (mainKeywords) {
      try {
        const questions = await getQuestionKeywords(mainKeywords, locale);
        for (const question of questions.slice(0, 10)) {
          const normalizedTag = question.toLowerCase().trim();
          if (!seenTags.has(normalizedTag) && normalizedTag.length > 5) {
            seenTags.add(normalizedTag);
            allTags.push({
              tag: normalizedTag,
              relevancyScore: 65, // Questions usually have moderate relevancy
              category: 'related',
              difficulty: 'easy', // Questions are usually easier to rank
              searchIntent: 'informational',
              source: 'Question Keywords',
            });
          }
        }
      } catch {
        // Skip on error
      }
    }

    // 4. Add common modifiers for main keyword
    const modifiers = ['free', 'online', 'best', 'easy', 'fast', 'app', 'tool', 'ai'];
    for (const modifier of modifiers) {
      if (mainKeywords) {
        const variations = [
          `${modifier} ${mainKeywords}`,
          `${mainKeywords} ${modifier}`,
        ];

        for (const variation of variations) {
          const normalizedTag = variation.toLowerCase().trim();
          if (!seenTags.has(normalizedTag) && normalizedTag.length > 5) {
            seenTags.add(normalizedTag);
            allTags.push({
              tag: normalizedTag,
              relevancyScore: 55,
              category: 'low_competition',
              difficulty: 'easy',
              searchIntent: modifier === 'free' ? 'transactional' : 'informational',
              source: 'Modifier Expansion',
            });
          }
        }
      }
    }

    // Sort by relevancy score
    allTags.sort((a, b) => b.relevancyScore - a.relevancyScore);

    // Limit tags
    const limitedTags = allTags.slice(0, maxTags);

    // Group tags by category
    const groups: TagGroup[] = [
      {
        name: 'Highly Relevant',
        icon: '💎',
        tags: limitedTags.filter(t => t.category === 'highly_relevant'),
      },
      {
        name: 'Related',
        icon: '🔗',
        tags: limitedTags.filter(t => t.category === 'related'),
      },
      {
        name: 'Trending',
        icon: '📈',
        tags: limitedTags.filter(t => t.category === 'trending'),
      },
      {
        name: 'Low Competition Gems',
        icon: '💡',
        tags: limitedTags.filter(t => t.category === 'low_competition'),
      },
    ].filter(g => g.tags.length > 0);

    // Statistics
    const stats = {
      total: limitedTags.length,
      byCategory: {
        highly_relevant: limitedTags.filter(t => t.category === 'highly_relevant').length,
        related: limitedTags.filter(t => t.category === 'related').length,
        trending: limitedTags.filter(t => t.category === 'trending').length,
        low_competition: limitedTags.filter(t => t.category === 'low_competition').length,
      },
      byDifficulty: {
        easy: limitedTags.filter(t => t.difficulty === 'easy').length,
        medium: limitedTags.filter(t => t.difficulty === 'medium').length,
        hard: limitedTags.filter(t => t.difficulty === 'hard').length,
      },
      averageRelevancy: limitedTags.length > 0
        ? Math.round(limitedTags.reduce((sum, t) => sum + t.relevancyScore, 0) / limitedTags.length)
        : 0,
    };

    return NextResponse.json({
      success: true,
      title,
      locale,
      tags: limitedTags,
      groups,
      stats,
    });
  } catch (error) {
    console.error('Error recommending tags:', error);
    return NextResponse.json(
      { error: 'Failed to recommend tags' },
      { status: 500 }
    );
  }
}
