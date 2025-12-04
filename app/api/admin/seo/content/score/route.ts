/**
 * Content Score API (Surfer SEO-style)
 * POST - Analyze content and calculate optimization score
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Content analysis result
export interface ContentScoreResult {
  totalScore: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

  // Individual scores
  scores: {
    keywordUsage: number; // 0-100
    contentStructure: number; // 0-100
    readability: number; // 0-100
    wordCount: number; // 0-100
    nlpTerms: number; // 0-100
  };

  // Detailed analysis
  analysis: {
    wordCount: number;
    targetWordCount: { min: number; max: number; optimal: number };
    keywordDensity: number;
    targetKeywordDensity: { min: number; max: number };
    headings: { h1: number; h2: number; h3: number };
    targetHeadings: { h2: { min: number; max: number }; h3: { min: number; max: number } };
    paragraphs: number;
    images: number;
    links: { internal: number; external: number };
    readabilityScore: number; // Flesch-like score
  };

  // NLP terms
  nlpTerms: {
    found: string[];
    missing: string[];
    overused: string[];
  };

  // Recommendations
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    message: string;
    action: string;
  }[];
}

// Extract text from HTML
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Count words
function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// Calculate keyword density
function calculateKeywordDensity(text: string, keyword: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const keywordWords = keyword.toLowerCase().split(/\s+/);

  let count = 0;
  for (let i = 0; i <= words.length - keywordWords.length; i++) {
    const phrase = words.slice(i, i + keywordWords.length).join(' ');
    if (phrase === keyword.toLowerCase()) {
      count++;
    }
  }

  const totalWords = words.length;
  return totalWords > 0 ? (count / totalWords) * 100 : 0;
}

// Count headings
function countHeadings(html: string): { h1: number; h2: number; h3: number } {
  const h1 = (html.match(/<h1[^>]*>/gi) || []).length;
  const h2 = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3 = (html.match(/<h3[^>]*>/gi) || []).length;
  return { h1, h2, h3 };
}

// Count paragraphs
function countParagraphs(html: string): number {
  return (html.match(/<p[^>]*>/gi) || []).length;
}

// Count images
function countImages(html: string): number {
  return (html.match(/<img[^>]*>/gi) || []).length;
}

// Count links
function countLinks(html: string): { internal: number; external: number } {
  const allLinks = html.match(/<a[^>]*href=["'][^"']*["'][^>]*>/gi) || [];
  let internal = 0;
  let external = 0;

  for (const link of allLinks) {
    if (link.includes('pixelift.pl') || link.startsWith('/') || !link.includes('http')) {
      internal++;
    } else {
      external++;
    }
  }

  return { internal, external };
}

// Calculate readability (simplified Flesch-like)
function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = words.reduce((sum, w) => sum + countSyllables(w), 0) / words.length;

  // Simplified Flesch Reading Ease
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, score));
}

// Count syllables (simplified)
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  const vowels = 'aeiouy';
  let count = 0;
  let prevVowel = false;

  for (const char of word) {
    const isVowel = vowels.includes(char);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Adjust for silent e
  if (word.endsWith('e')) count--;

  return Math.max(1, count);
}

// Get grade from score
function getGrade(score: number): ContentScoreResult['grade'] {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

// AI prompt for NLP analysis
const NLP_ANALYSIS_PROMPT = `You are an SEO content analyst. Analyze the given content for a target keyword.

Extract:
1. Important NLP terms that SHOULD be in the content (semantic keywords, related concepts)
2. Terms that are MISSING from the content but should be added
3. Terms that are OVERUSED and should be reduced

Context: This is content for Pixelift, an AI image editing tool website.

Return JSON:
{
  "foundTerms": ["term1", "term2"],
  "missingTerms": ["term3", "term4"],
  "overusedTerms": ["term5"],
  "contentSuggestions": ["Add more detail about...", "Mention the benefit of..."]
}

Rules:
- Focus on semantically relevant terms
- Missing terms should be genuinely valuable for SEO
- Overused terms are those appearing excessively (>3% density)
- Keep suggestions actionable`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, keyword, title, locale = 'en' } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Target keyword is required' },
        { status: 400 }
      );
    }

    // Basic content analysis
    const plainText = stripHtml(content);
    const wordCount = countWords(plainText);
    const keywordDensity = calculateKeywordDensity(plainText, keyword);
    const headings = countHeadings(content);
    const paragraphs = countParagraphs(content);
    const images = countImages(content);
    const links = countLinks(content);
    const readabilityScore = calculateReadability(plainText);

    // Target benchmarks (based on top-ranking content analysis)
    const targetWordCount = { min: 1500, max: 3000, optimal: 2000 };
    const targetKeywordDensity = { min: 0.5, max: 2.5 };
    const targetHeadings = {
      h2: { min: 3, max: 8 },
      h3: { min: 2, max: 10 },
    };

    // Calculate individual scores

    // Word count score
    let wordCountScore = 0;
    if (wordCount >= targetWordCount.min && wordCount <= targetWordCount.max) {
      wordCountScore = 100;
    } else if (wordCount < targetWordCount.min) {
      wordCountScore = Math.max(0, (wordCount / targetWordCount.min) * 100);
    } else {
      wordCountScore = Math.max(50, 100 - ((wordCount - targetWordCount.max) / targetWordCount.max) * 50);
    }

    // Keyword usage score
    let keywordUsageScore = 0;
    if (keywordDensity >= targetKeywordDensity.min && keywordDensity <= targetKeywordDensity.max) {
      keywordUsageScore = 100;
    } else if (keywordDensity < targetKeywordDensity.min) {
      keywordUsageScore = Math.max(0, (keywordDensity / targetKeywordDensity.min) * 100);
    } else {
      keywordUsageScore = Math.max(30, 100 - ((keywordDensity - targetKeywordDensity.max) * 20));
    }

    // Content structure score
    let structureScore = 0;
    if (headings.h1 === 1) structureScore += 25;
    if (headings.h2 >= targetHeadings.h2.min && headings.h2 <= targetHeadings.h2.max) {
      structureScore += 35;
    } else if (headings.h2 > 0) {
      structureScore += 20;
    }
    if (headings.h3 >= targetHeadings.h3.min) structureScore += 20;
    if (paragraphs >= 5) structureScore += 10;
    if (images >= 1) structureScore += 10;

    // Readability score (normalize to 0-100)
    const normalizedReadability = Math.min(100, Math.max(0, readabilityScore));

    // NLP terms score (will be updated after AI analysis)
    let nlpTermsScore = 50; // Default

    // Initialize NLP terms
    let nlpTerms = {
      found: [] as string[],
      missing: [] as string[],
      overused: [] as string[],
    };

    // AI-powered NLP analysis
    let contentSuggestions: string[] = [];
    try {
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: NLP_ANALYSIS_PROMPT },
          {
            role: 'user',
            content: `Target Keyword: ${keyword}\nTitle: ${title || 'No title'}\n\nContent:\n${plainText.slice(0, 3000)}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const aiContent = aiResponse.choices[0]?.message?.content;
      if (aiContent) {
        const parsed = JSON.parse(aiContent);
        nlpTerms = {
          found: parsed.foundTerms || [],
          missing: parsed.missingTerms || [],
          overused: parsed.overusedTerms || [],
        };
        contentSuggestions = parsed.contentSuggestions || [];

        // Calculate NLP score based on terms
        const foundRatio = nlpTerms.found.length / Math.max(1, nlpTerms.found.length + nlpTerms.missing.length);
        const overuseDeduction = nlpTerms.overused.length * 10;
        nlpTermsScore = Math.max(0, Math.round(foundRatio * 100) - overuseDeduction);
      }
    } catch (aiError) {
      console.error('AI NLP analysis failed:', aiError);
    }

    // Calculate total score (weighted average)
    const totalScore = Math.round(
      (keywordUsageScore * 0.25) +
      (structureScore * 0.20) +
      (normalizedReadability * 0.15) +
      (wordCountScore * 0.20) +
      (nlpTermsScore * 0.20)
    );

    // Generate recommendations
    const recommendations: ContentScoreResult['recommendations'] = [];

    // Word count recommendations
    if (wordCount < targetWordCount.min) {
      recommendations.push({
        priority: 'high',
        category: 'Word Count',
        message: `Content is too short (${wordCount} words)`,
        action: `Add ${targetWordCount.min - wordCount} more words to reach minimum of ${targetWordCount.min}`,
      });
    } else if (wordCount > targetWordCount.max) {
      recommendations.push({
        priority: 'low',
        category: 'Word Count',
        message: `Content may be too long (${wordCount} words)`,
        action: `Consider trimming to ${targetWordCount.max} words for better engagement`,
      });
    }

    // Keyword recommendations
    if (keywordDensity < targetKeywordDensity.min) {
      recommendations.push({
        priority: 'high',
        category: 'Keyword Usage',
        message: `Keyword density is too low (${keywordDensity.toFixed(2)}%)`,
        action: `Add "${keyword}" ${Math.ceil((targetKeywordDensity.min - keywordDensity) * wordCount / 100)} more times`,
      });
    } else if (keywordDensity > targetKeywordDensity.max) {
      recommendations.push({
        priority: 'medium',
        category: 'Keyword Usage',
        message: `Keyword density is too high (${keywordDensity.toFixed(2)}%)`,
        action: `Reduce usage of "${keyword}" to avoid over-optimization`,
      });
    }

    // Structure recommendations
    if (headings.h1 === 0) {
      recommendations.push({
        priority: 'high',
        category: 'Structure',
        message: 'Missing H1 heading',
        action: 'Add a main H1 heading with your target keyword',
      });
    } else if (headings.h1 > 1) {
      recommendations.push({
        priority: 'medium',
        category: 'Structure',
        message: `Multiple H1 headings (${headings.h1})`,
        action: 'Use only one H1 heading per page',
      });
    }

    if (headings.h2 < targetHeadings.h2.min) {
      recommendations.push({
        priority: 'medium',
        category: 'Structure',
        message: `Not enough H2 headings (${headings.h2})`,
        action: `Add ${targetHeadings.h2.min - headings.h2} more H2 sections to improve structure`,
      });
    }

    if (images === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Media',
        message: 'No images in content',
        action: 'Add relevant images with alt text containing keywords',
      });
    }

    if (links.internal === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Links',
        message: 'No internal links',
        action: 'Add 2-3 internal links to related content',
      });
    }

    if (links.external === 0) {
      recommendations.push({
        priority: 'low',
        category: 'Links',
        message: 'No external links',
        action: 'Consider adding 1-2 links to authoritative sources',
      });
    }

    // NLP recommendations
    for (const term of nlpTerms.missing.slice(0, 5)) {
      recommendations.push({
        priority: 'medium',
        category: 'NLP Terms',
        message: `Missing important term: "${term}"`,
        action: `Add "${term}" naturally to your content`,
      });
    }

    for (const term of nlpTerms.overused) {
      recommendations.push({
        priority: 'low',
        category: 'NLP Terms',
        message: `Overused term: "${term}"`,
        action: `Reduce usage of "${term}" or use synonyms`,
      });
    }

    // Content suggestions from AI
    for (const suggestion of contentSuggestions.slice(0, 3)) {
      recommendations.push({
        priority: 'medium',
        category: 'Content',
        message: suggestion,
        action: 'Expand content with this topic',
      });
    }

    // Sort recommendations by priority
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const result: ContentScoreResult = {
      totalScore,
      grade: getGrade(totalScore),
      scores: {
        keywordUsage: Math.round(keywordUsageScore),
        contentStructure: Math.round(structureScore),
        readability: Math.round(normalizedReadability),
        wordCount: Math.round(wordCountScore),
        nlpTerms: Math.round(nlpTermsScore),
      },
      analysis: {
        wordCount,
        targetWordCount,
        keywordDensity: Math.round(keywordDensity * 100) / 100,
        targetKeywordDensity,
        headings,
        targetHeadings,
        paragraphs,
        images,
        links,
        readabilityScore: Math.round(readabilityScore),
      },
      nlpTerms,
      recommendations,
    };

    return NextResponse.json({
      success: true,
      keyword,
      locale,
      ...result,
    });
  } catch (error) {
    console.error('Error calculating content score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate content score' },
      { status: 500 }
    );
  }
}
