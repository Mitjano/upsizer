'use client';

import { useState, useEffect, useCallback } from 'react';

interface ContentScoreResult {
  totalScore: number;
  grade: string;
  scores: {
    keywordUsage: number;
    contentStructure: number;
    readability: number;
    wordCount: number;
    nlpTerms: number;
  };
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
    readabilityScore: number;
  };
  nlpTerms: {
    found: string[];
    missing: string[];
    overused: string[];
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    message: string;
    action: string;
  }[];
}

interface TagRecommendation {
  tag: string;
  relevancyScore: number;
  category: 'highly_relevant' | 'related' | 'trending' | 'low_competition';
  difficulty: 'easy' | 'medium' | 'hard';
}

interface InternalLink {
  title: string;
  slug: string;
  relevance: number;
  excerpt: string;
}

interface Props {
  title: string;
  content: string;
  excerpt: string;
  currentTags: string;
  targetKeyword?: string;
  onTagsChange: (tags: string) => void;
  onKeywordChange?: (keyword: string) => void;
  locale?: string;
}

export default function BlogSEOAssistant({
  title,
  content,
  excerpt,
  currentTags,
  targetKeyword = '',
  onTagsChange,
  onKeywordChange,
  locale = 'en',
}: Props) {
  // State
  const [activeTab, setActiveTab] = useState<'score' | 'tags' | 'links'>('score');
  const [isMinimized, setIsMinimized] = useState(false);

  // Content Score state
  const [keyword, setKeyword] = useState(targetKeyword);
  const [scoreData, setScoreData] = useState<ContentScoreResult | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);

  // Tags state
  const [tagRecommendations, setTagRecommendations] = useState<TagRecommendation[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Internal links state
  const [internalLinks, setInternalLinks] = useState<InternalLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);

  // Parse tags
  const parsedTags = currentTags
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  // Analyze content score
  const analyzeContent = useCallback(async () => {
    if (!content.trim() || !keyword.trim()) return;

    setScoreLoading(true);
    try {
      const response = await fetch('/api/admin/seo/content/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          keyword,
          title,
          locale,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScoreData(data);
      }
    } catch (err) {
      console.error('Failed to analyze content:', err);
    } finally {
      setScoreLoading(false);
    }
  }, [content, keyword, title, locale]);

  // Auto-analyze on content change
  useEffect(() => {
    if (!autoAnalyze || !content.trim() || !keyword.trim()) return;

    const timeout = setTimeout(() => {
      analyzeContent();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [content, keyword, autoAnalyze, analyzeContent]);

  // Fetch tag recommendations
  const fetchTags = useCallback(async () => {
    if (!title.trim()) return;

    setTagsLoading(true);
    try {
      const response = await fetch('/api/admin/seo/tags/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, locale, maxTags: 30 }),
      });

      if (response.ok) {
        const data = await response.json();
        setTagRecommendations(data.tags || []);
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    } finally {
      setTagsLoading(false);
    }
  }, [title, content, locale]);

  // Fetch internal link suggestions
  const fetchInternalLinks = useCallback(async () => {
    if (!title.trim() && !content.trim()) return;

    setLinksLoading(true);
    try {
      const response = await fetch('/api/admin/seo/content/internal-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, locale, limit: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        setInternalLinks(data.suggestions || []);
      }
    } catch (err) {
      console.error('Failed to fetch internal links:', err);
    } finally {
      setLinksLoading(false);
    }
  }, [title, content, locale]);

  // Handle tab change and fetch data
  const handleTabChange = (tab: 'score' | 'tags' | 'links') => {
    setActiveTab(tab);
    if (tab === 'tags' && tagRecommendations.length === 0 && title.trim()) {
      fetchTags();
    }
    if (tab === 'links' && internalLinks.length === 0) {
      fetchInternalLinks();
    }
  };

  // Add tag
  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!parsedTags.includes(normalizedTag)) {
      const newTags = [...parsedTags, normalizedTag];
      onTagsChange(newTags.join(', '));
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    const newTags = parsedTags.filter(t => t !== tag);
    onTagsChange(newTags.join(', '));
  };

  // Get colors
  const getGradeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'text-green-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-500/10';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low': return 'border-blue-500/50 bg-blue-500/10';
      default: return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed right-4 bottom-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition"
        >
          <span>📊</span>
          <span>SEO Assistant</span>
          {scoreData && (
            <span className={`font-bold ${getGradeColor(scoreData.grade)}`}>
              {scoreData.grade}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 border border-emerald-500/30 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-900/50 px-4 py-3 flex items-center justify-between">
        <h3 className="font-bold text-emerald-400 flex items-center gap-2">
          <span>📊</span> SEO Assistant
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded"
          >
            _
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => handleTabChange('score')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'score'
              ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/10'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Content Score
        </button>
        <button
          onClick={() => handleTabChange('tags')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'tags'
              ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Tags
        </button>
        <button
          onClick={() => handleTabChange('links')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition ${
            activeTab === 'links'
              ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Links
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {/* Score Tab */}
        {activeTab === 'score' && (
          <div className="space-y-4">
            {/* Keyword Input */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Target Keyword</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    onKeywordChange?.(e.target.value);
                  }}
                  placeholder="e.g., remove background"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
                <button
                  onClick={analyzeContent}
                  disabled={scoreLoading || !keyword.trim() || !content.trim()}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white rounded text-sm font-medium transition"
                >
                  {scoreLoading ? '...' : 'Analyze'}
                </button>
              </div>
              <label className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={autoAnalyze}
                  onChange={(e) => setAutoAnalyze(e.target.checked)}
                  className="rounded"
                />
                Auto-analyze on changes
              </label>
            </div>

            {/* Score Display */}
            {scoreData ? (
              <>
                {/* Main Score */}
                <div className="text-center py-4 bg-gray-800/50 rounded-lg">
                  <div className={`text-5xl font-bold ${getGradeColor(scoreData.grade)}`}>
                    {scoreData.totalScore}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Content Score</div>
                  <div className={`text-2xl font-bold ${getGradeColor(scoreData.grade)} mt-1`}>
                    Grade: {scoreData.grade}
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">Score Breakdown</h4>
                  {[
                    { label: 'Keyword Usage', score: scoreData.scores.keywordUsage },
                    { label: 'Content Structure', score: scoreData.scores.contentStructure },
                    { label: 'Readability', score: scoreData.scores.readability },
                    { label: 'Word Count', score: scoreData.scores.wordCount },
                    { label: 'NLP Terms', score: scoreData.scores.nlpTerms },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-28">{item.label}</span>
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            item.score >= 70 ? 'bg-green-500' :
                            item.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${getScoreColor(item.score)}`}>
                        {item.score}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-lg font-bold text-white">{scoreData.analysis.wordCount}</div>
                    <div className="text-[10px] text-gray-400">Words</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-lg font-bold text-white">{scoreData.analysis.headings.h2}</div>
                    <div className="text-[10px] text-gray-400">H2 Headings</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-lg font-bold text-white">{scoreData.analysis.images}</div>
                    <div className="text-[10px] text-gray-400">Images</div>
                  </div>
                </div>

                {/* NLP Terms */}
                {(scoreData.nlpTerms.missing.length > 0 || scoreData.nlpTerms.found.length > 0) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">NLP Terms</h4>

                    {scoreData.nlpTerms.found.length > 0 && (
                      <div>
                        <span className="text-xs text-green-400">Found:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {scoreData.nlpTerms.found.slice(0, 8).map((term) => (
                            <span key={term} className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {scoreData.nlpTerms.missing.length > 0 && (
                      <div>
                        <span className="text-xs text-yellow-400">Missing (add these):</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {scoreData.nlpTerms.missing.slice(0, 8).map((term) => (
                            <span key={term} className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-[10px]">
                              + {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Top Recommendations */}
                {scoreData.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Top Recommendations</h4>
                    {scoreData.recommendations.slice(0, 3).map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border ${getPriorityColor(rec.priority)}`}
                      >
                        <div className="text-xs text-white font-medium">{rec.message}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{rec.action}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm">Enter a keyword and click Analyze</p>
                <p className="text-xs mt-1">to get your content score</p>
              </div>
            )}
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          <div className="space-y-4">
            {/* Current Tags */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Current Tags ({parsedTags.length}/30)</span>
              </div>
              {parsedTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {parsedTags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-xs flex items-center gap-1"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-white">✕</button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tags yet</p>
              )}
            </div>

            {/* Recommendations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Recommended Tags</span>
                <button
                  onClick={fetchTags}
                  disabled={tagsLoading || !title.trim()}
                  className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                >
                  {tagsLoading ? 'Loading...' : '🔄 Refresh'}
                </button>
              </div>

              {tagsLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-500"></div>
                  Analyzing...
                </div>
              ) : tagRecommendations.length > 0 ? (
                <div className="space-y-2">
                  {/* Group by category */}
                  {['highly_relevant', 'related', 'trending', 'low_competition'].map(category => {
                    const categoryTags = tagRecommendations.filter(t => t.category === category);
                    if (categoryTags.length === 0) return null;

                    const categoryLabels: Record<string, string> = {
                      highly_relevant: '💎 Highly Relevant',
                      related: '🔗 Related',
                      trending: '📈 Trending',
                      low_competition: '💡 Low Competition',
                    };

                    return (
                      <div key={category}>
                        <span className="text-[10px] text-gray-500 uppercase">{categoryLabels[category]}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {categoryTags
                            .filter(r => !parsedTags.includes(r.tag.toLowerCase()))
                            .slice(0, 5)
                            .map(rec => (
                              <button
                                key={rec.tag}
                                onClick={() => addTag(rec.tag)}
                                className="px-2 py-1 bg-gray-700/50 border border-gray-600 text-gray-300 rounded text-xs hover:border-cyan-500/50 hover:text-cyan-400 transition flex items-center gap-1"
                              >
                                <span>+</span>
                                <span>{rec.tag}</span>
                                <span className={`text-[10px] ${getDifficultyColor(rec.difficulty)}`}>
                                  {rec.relevancyScore}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4">
                  {title.trim() ? 'Click refresh to load recommendations.' : 'Enter a title first.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Internal Link Suggestions</span>
              <button
                onClick={fetchInternalLinks}
                disabled={linksLoading}
                className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50"
              >
                {linksLoading ? 'Loading...' : '🔄 Refresh'}
              </button>
            </div>

            {linksLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                Finding related posts...
              </div>
            ) : internalLinks.length > 0 ? (
              <div className="space-y-2">
                {internalLinks.map((link, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-purple-500/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-white">{link.title}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">/blog/{link.slug}</p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{link.excerpt}</p>
                      </div>
                      <div className="ml-2 px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-[10px]">
                        {Math.round(link.relevance * 100)}%
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`[${link.title}](/blog/${link.slug})`);
                      }}
                      className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                    >
                      📋 Copy Markdown Link
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🔗</div>
                <p className="text-sm">No related posts found</p>
                <p className="text-xs mt-1">Try adding more content</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-700">
              <p className="text-[10px] text-gray-500">
                💡 Adding 2-3 internal links helps SEO and user engagement.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
