/**
 * People Also Ask / Questions API
 * POST - Get question-based content opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Question {
  question: string;
  type: 'how' | 'what' | 'why' | 'when' | 'where' | 'which' | 'can' | 'is' | 'other';
  searchIntent: 'informational' | 'transactional' | 'navigational';
  difficulty: 'easy' | 'medium' | 'hard';
  suggestedFormat: 'paragraph' | 'list' | 'step-by-step' | 'comparison' | 'definition';
  estimatedAnswerLength: number;
  relatedQuestions: string[];
}

interface QuestionGroup {
  category: string;
  questions: Question[];
}

// Question prefixes for Google Suggest mining
const QUESTION_PREFIXES = [
  'how to', 'how do I', 'how can I',
  'what is', 'what are', 'what does',
  'why is', 'why do', 'why does',
  'when to', 'when should I',
  'where to', 'where can I',
  'which', 'which is better',
  'can I', 'can you',
  'is it', 'is there',
  'does', 'do I need',
  'should I', 'best way to'
];

// Alternative question formats
const QUESTION_SUFFIXES = [
  'vs', 'or', 'without',
  'for free', 'online',
  'in photoshop', 'with ai',
  'on iphone', 'on android',
  'for beginners', 'step by step'
];

// Get questions from Google Suggest
async function getGoogleSuggestQuestions(keyword: string, locale: string): Promise<string[]> {
  const questions: Set<string> = new Set();

  // Question prefixes
  const prefixPromises = QUESTION_PREFIXES.map(async (prefix) => {
    try {
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(`${prefix} ${keyword}`)}&hl=${locale}`
      );
      const data = await response.json();
      return data[1] || [];
    } catch {
      return [];
    }
  });

  // Question suffixes (keyword first)
  const suffixPromises = QUESTION_SUFFIXES.slice(0, 5).map(async (suffix) => {
    try {
      const response = await fetch(
        `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(`${keyword} ${suffix}`)}&hl=${locale}`
      );
      const data = await response.json();
      return data[1] || [];
    } catch {
      return [];
    }
  });

  const results = await Promise.all([...prefixPromises, ...suffixPromises]);

  for (const suggestions of results) {
    for (const suggestion of suggestions) {
      if (suggestion.toLowerCase() !== keyword.toLowerCase()) {
        questions.add(suggestion);
      }
    }
  }

  return [...questions];
}

// Categorize question type
function categorizeQuestion(question: string): Question['type'] {
  const q = question.toLowerCase();
  if (q.startsWith('how')) return 'how';
  if (q.startsWith('what')) return 'what';
  if (q.startsWith('why')) return 'why';
  if (q.startsWith('when')) return 'when';
  if (q.startsWith('where')) return 'where';
  if (q.startsWith('which')) return 'which';
  if (q.startsWith('can')) return 'can';
  if (q.startsWith('is') || q.startsWith('are')) return 'is';
  return 'other';
}

// AI analysis prompt
const QUESTION_ANALYSIS_PROMPT = `You are an SEO expert analyzing search questions for content opportunities.

For each question, determine:
1. Search intent (informational, transactional, navigational)
2. Ranking difficulty (easy, medium, hard)
3. Best answer format (paragraph, list, step-by-step, comparison, definition)
4. Estimated answer length in words
5. Related follow-up questions

Also group questions by topic category.

Return JSON:
{
  "groups": [
    {
      "category": "Getting Started",
      "questions": [
        {
          "question": "how to remove background from image",
          "type": "how",
          "searchIntent": "informational",
          "difficulty": "medium",
          "suggestedFormat": "step-by-step",
          "estimatedAnswerLength": 300,
          "relatedQuestions": ["what is the best tool?", "is it free?"]
        }
      ]
    }
  ],
  "topOpportunities": ["Question with best ranking potential", "Second best"]
}`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, locale = 'en', limit = 50 } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // Gather questions from Google Suggest
    const rawQuestions = await getGoogleSuggestQuestions(keyword, locale);

    // Pre-categorize questions
    const categorizedQuestions = rawQuestions.slice(0, limit).map(q => ({
      question: q,
      type: categorizeQuestion(q),
    }));

    // Use AI to analyze and group questions
    let groups: QuestionGroup[] = [];
    let topOpportunities: string[] = [];

    try {
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: QUESTION_ANALYSIS_PROMPT },
          {
            role: 'user',
            content: `Analyze these questions for the keyword "${keyword}":
${categorizedQuestions.map(q => `- ${q.question}`).join('\n')}

Context: These questions are for Pixelift, an AI image editing tool.
Identify the best content opportunities and group by topic.`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const aiContent = aiResponse.choices[0]?.message?.content;
      if (aiContent) {
        const parsed = JSON.parse(aiContent);
        groups = parsed.groups || [];
        topOpportunities = parsed.topOpportunities || [];
      }
    } catch (aiError) {
      console.error('AI analysis failed:', aiError);

      // Fallback: Simple grouping by question type
      const byType: Record<string, Question[]> = {};

      for (const q of categorizedQuestions) {
        if (!byType[q.type]) {
          byType[q.type] = [];
        }
        byType[q.type].push({
          question: q.question,
          type: q.type,
          searchIntent: 'informational',
          difficulty: 'medium',
          suggestedFormat: q.type === 'how' ? 'step-by-step' : 'paragraph',
          estimatedAnswerLength: 200,
          relatedQuestions: [],
        });
      }

      const typeLabels: Record<string, string> = {
        how: 'How-to Questions',
        what: 'Definitions & Explanations',
        why: 'Reasons & Benefits',
        when: 'Timing & Usage',
        can: 'Capabilities & Possibilities',
        is: 'Yes/No Questions',
        other: 'Other Questions',
      };

      groups = Object.entries(byType).map(([type, questions]) => ({
        category: typeLabels[type] || type,
        questions,
      }));
    }

    // Calculate stats
    const totalQuestions = groups.reduce((sum, g) => sum + g.questions.length, 0);
    const easyQuestions = groups.reduce((sum, g) =>
      sum + g.questions.filter(q => q.difficulty === 'easy').length, 0);

    return NextResponse.json({
      success: true,
      keyword,
      locale,
      stats: {
        totalQuestions,
        categoriesCount: groups.length,
        easyOpportunities: easyQuestions,
      },
      groups,
      topOpportunities: topOpportunities.slice(0, 5),
      rawQuestions: rawQuestions.slice(0, 20),
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}
