/**
 * Tag Score Calculator API
 * POST - Calculate total score for a selection of tags
 * Similar to VidIQ's tag score system
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TagScore {
  tag: string;
  relevancyScore: number; // 0-100
  competitionScore: number; // 0-100 (lower is better for ranking)
  optimizationScore: number; // 0-100
  issues: string[];
  suggestions: string[];
}

interface ScoreResult {
  totalScore: number; // 0-1000
  maxPossibleScore: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  tagScores: TagScore[];
  summary: {
    totalTags: number;
    averageRelevancy: number;
    averageCompetition: number;
    diversityScore: number;
    recommendations: string[];
  };
}

// AI prompt for tag scoring
const SCORING_PROMPT = `You are an SEO expert analyzing a set of tags for a blog post.

Context: This is for Pixelift, an AI image editing tool website with features like background removal, image upscaling, and photo editing.

For each tag, analyze:
1. Relevancy (0-100): How relevant is this tag to the title and niche?
2. Competition (0-100): Higher = more competitive, harder to rank
3. Issues: Any problems with this tag?
4. Suggestions: How to improve this tag?

Also provide overall recommendations for the tag set.

Return JSON:
{
  "tagAnalysis": [
    {
      "tag": "remove background",
      "relevancy": 90,
      "competition": 65,
      "issues": [],
      "suggestions": ["Consider adding 'free' for better CTR"]
    }
  ],
  "overallRecommendations": [
    "Add more long-tail keywords",
    "Include question-based tags"
  ],
  "diversityScore": 75
}`;

// Calculate grade based on percentage
function getGrade(percentage: number): ScoreResult['grade'] {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

// Simple relevancy estimation (fallback)
function estimateRelevancy(tag: string, title: string): number {
  const titleWords = title.toLowerCase().split(/\s+/);
  const tagWords = tag.toLowerCase().split(/\s+/);

  let matchCount = 0;
  for (const tagWord of tagWords) {
    if (titleWords.some(tw => tw.includes(tagWord) || tagWord.includes(tw))) {
      matchCount++;
    }
  }

  const baseScore = (matchCount / tagWords.length) * 70;
  return Math.round(Math.min(100, baseScore + 30)); // Minimum 30 for being selected
}

// Estimate competition based on word count
function estimateCompetition(tag: string): number {
  const wordCount = tag.split(' ').length;

  // Long-tail = less competition
  if (wordCount >= 5) return 25;
  if (wordCount >= 4) return 35;
  if (wordCount >= 3) return 50;
  if (wordCount >= 2) return 65;
  return 85; // Single word = high competition
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tags, title, useAI = true } = body;

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: 'Tags array is required' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required for scoring' },
        { status: 400 }
      );
    }

    // Limit tags
    const tagsToScore = tags.slice(0, 30).map((t: string) => t.trim().toLowerCase()).filter(Boolean);

    let tagScores: TagScore[] = [];
    let recommendations: string[] = [];
    let diversityScore = 50; // Default

    // Use AI for detailed analysis
    if (useAI && process.env.OPENAI_API_KEY) {
      try {
        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SCORING_PROMPT },
            {
              role: 'user',
              content: `Title: ${title}\n\nTags to analyze:\n${tagsToScore.map((t, i) => `${i + 1}. ${t}`).join('\n')}`,
            },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });

        const content = aiResponse.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);

          for (const tag of tagsToScore) {
            const analysis = parsed.tagAnalysis?.find(
              (a: { tag: string }) => a.tag.toLowerCase() === tag.toLowerCase()
            );

            if (analysis) {
              const optimizationScore = Math.round(
                (analysis.relevancy * 0.6) + ((100 - analysis.competition) * 0.4)
              );

              tagScores.push({
                tag,
                relevancyScore: analysis.relevancy || 50,
                competitionScore: analysis.competition || 50,
                optimizationScore,
                issues: analysis.issues || [],
                suggestions: analysis.suggestions || [],
              });
            } else {
              // Fallback for missing tags
              const relevancy = estimateRelevancy(tag, title);
              const competition = estimateCompetition(tag);
              const optimizationScore = Math.round((relevancy * 0.6) + ((100 - competition) * 0.4));

              tagScores.push({
                tag,
                relevancyScore: relevancy,
                competitionScore: competition,
                optimizationScore,
                issues: [],
                suggestions: [],
              });
            }
          }

          recommendations = parsed.overallRecommendations || [];
          diversityScore = parsed.diversityScore || 50;
        }
      } catch (aiError) {
        console.error('AI scoring failed:', aiError);
        // Fall through to manual scoring
      }
    }

    // Fallback: Manual scoring if AI failed or disabled
    if (tagScores.length === 0) {
      for (const tag of tagsToScore) {
        const relevancy = estimateRelevancy(tag, title);
        const competition = estimateCompetition(tag);
        const optimizationScore = Math.round((relevancy * 0.6) + ((100 - competition) * 0.4));

        tagScores.push({
          tag,
          relevancyScore: relevancy,
          competitionScore: competition,
          optimizationScore,
          issues: [],
          suggestions: [],
        });
      }

      // Default recommendations
      const avgWordCount = tagsToScore.reduce((sum, t) => sum + t.split(' ').length, 0) / tagsToScore.length;
      if (avgWordCount < 3) {
        recommendations.push('Add more long-tail keywords (3-5 words)');
      }
      if (tagsToScore.length < 10) {
        recommendations.push('Consider adding more tags (aim for 15-30)');
      }
      if (tagsToScore.every(t => !t.includes('?') && !t.startsWith('how') && !t.startsWith('what'))) {
        recommendations.push('Include question-based keywords for featured snippets');
      }
    }

    // Calculate total score
    const totalOptimizationScore = tagScores.reduce((sum, t) => sum + t.optimizationScore, 0);
    const maxPossibleScore = tagScores.length * 100;
    const percentage = maxPossibleScore > 0 ? Math.round((totalOptimizationScore / maxPossibleScore) * 100) : 0;

    // Scale to 0-1000 for display
    const totalScore = Math.round((percentage / 100) * 1000);

    // Calculate averages
    const averageRelevancy = tagScores.length > 0
      ? Math.round(tagScores.reduce((sum, t) => sum + t.relevancyScore, 0) / tagScores.length)
      : 0;
    const averageCompetition = tagScores.length > 0
      ? Math.round(tagScores.reduce((sum, t) => sum + t.competitionScore, 0) / tagScores.length)
      : 0;

    const result: ScoreResult = {
      totalScore,
      maxPossibleScore: 1000,
      percentage,
      grade: getGrade(percentage),
      tagScores: tagScores.sort((a, b) => b.optimizationScore - a.optimizationScore),
      summary: {
        totalTags: tagScores.length,
        averageRelevancy,
        averageCompetition,
        diversityScore,
        recommendations,
      },
    };

    return NextResponse.json({
      success: true,
      title,
      ...result,
    });
  } catch (error) {
    console.error('Error calculating tag score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate tag score' },
      { status: 500 }
    );
  }
}
