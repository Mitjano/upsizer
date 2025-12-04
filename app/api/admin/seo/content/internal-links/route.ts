/**
 * Internal Links Suggestions API
 * POST - Find related blog posts for internal linking
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  tags: string[];
  categories: string[];
}

interface LinkSuggestion {
  title: string;
  slug: string;
  excerpt: string;
  relevance: number;
  reason?: string;
}

// Load blog posts from JSON files
async function loadBlogPosts(): Promise<BlogPost[]> {
  const blogDir = path.join(process.cwd(), 'data', 'blog');

  try {
    if (!fs.existsSync(blogDir)) {
      return [];
    }

    const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.json'));
    const posts: BlogPost[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
        const post = JSON.parse(content);
        if (post.status === 'published') {
          posts.push(post);
        }
      } catch {
        // Skip invalid files
      }
    }

    return posts;
  } catch {
    return [];
  }
}

// Calculate text similarity (simple bag of words)
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(
    text1.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
  );

  const words2 = new Set(
    text2.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
  );

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

// AI-powered relevance scoring
async function getAIRelevanceScores(
  currentTitle: string,
  currentContent: string,
  posts: BlogPost[]
): Promise<Map<string, { relevance: number; reason: string }>> {
  const scores = new Map<string, { relevance: number; reason: string }>();

  if (posts.length === 0) return scores;

  try {
    const postSummaries = posts.slice(0, 10).map((p, i) =>
      `${i + 1}. "${p.title}" - ${p.excerpt.slice(0, 100)}...`
    ).join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an SEO expert. Analyze which existing blog posts would be good internal link targets for a new article.

Return JSON array with relevance scores (0-1) for each post:
[
  {"index": 1, "relevance": 0.85, "reason": "Directly related topic"},
  {"index": 2, "relevance": 0.45, "reason": "Partially related"},
  ...
]

Rules:
- Score 0.8-1.0: Highly relevant, direct topic relationship
- Score 0.5-0.79: Moderately relevant, related topic
- Score 0.2-0.49: Somewhat relevant, tangential connection
- Score 0-0.19: Not relevant enough for internal linking`,
        },
        {
          role: 'user',
          content: `New article title: "${currentTitle}"
New article preview: "${currentContent.slice(0, 500)}..."

Existing posts to evaluate:
${postSummaries}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const aiContent = response.choices[0]?.message?.content;
    if (aiContent) {
      const parsed = JSON.parse(aiContent);
      const results = parsed.results || parsed;

      if (Array.isArray(results)) {
        results.forEach((item: { index: number; relevance: number; reason: string }) => {
          const post = posts[item.index - 1];
          if (post) {
            scores.set(post.id, {
              relevance: item.relevance,
              reason: item.reason
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('AI relevance scoring failed:', err);
  }

  return scores;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, locale = 'en', limit = 5, currentPostId } = body;

    if (!title && !content) {
      return NextResponse.json(
        { error: 'Title or content is required' },
        { status: 400 }
      );
    }

    // Load all published posts
    const allPosts = await loadBlogPosts();

    // Filter out current post if editing
    const candidatePosts = currentPostId
      ? allPosts.filter(p => p.id !== currentPostId)
      : allPosts;

    if (candidatePosts.length === 0) {
      return NextResponse.json({
        success: true,
        suggestions: [],
        message: 'No published blog posts found',
      });
    }

    // Calculate basic similarity scores
    const combinedText = `${title} ${content}`;
    const scoredPosts = candidatePosts.map(post => ({
      post,
      similarity: calculateSimilarity(
        combinedText,
        `${post.title} ${post.excerpt} ${post.content}`
      ),
    }));

    // Sort by similarity and take top candidates
    scoredPosts.sort((a, b) => b.similarity - a.similarity);
    const topCandidates = scoredPosts.slice(0, 10);

    // Get AI-powered relevance scores for top candidates
    const aiScores = await getAIRelevanceScores(
      title || '',
      content || '',
      topCandidates.map(c => c.post)
    );

    // Combine scores and create suggestions
    const suggestions: LinkSuggestion[] = topCandidates
      .map(({ post, similarity }) => {
        const aiScore = aiScores.get(post.id);
        // Combine basic similarity with AI score
        const finalRelevance = aiScore
          ? (similarity * 0.3 + aiScore.relevance * 0.7)
          : similarity;

        return {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt.slice(0, 150) + '...',
          relevance: Math.round(finalRelevance * 100) / 100,
          reason: aiScore?.reason,
        };
      })
      .filter(s => s.relevance >= 0.2) // Only include relevant suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      suggestions,
      totalPosts: candidatePosts.length,
    });
  } catch (error) {
    console.error('Error finding internal links:', error);
    return NextResponse.json(
      { error: 'Failed to find internal link suggestions' },
      { status: 500 }
    );
  }
}
