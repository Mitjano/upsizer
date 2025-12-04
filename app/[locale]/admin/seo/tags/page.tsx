'use client';

import { useState } from 'react';

interface TagRecommendation {
  tag: string;
  relevancyScore: number;
  category: 'highly_relevant' | 'related' | 'trending' | 'low_competition';
  difficulty: 'easy' | 'medium' | 'hard';
  searchIntent: 'informational' | 'navigational' | 'transactional' | 'commercial';
  source: string;
}

interface TagGroup {
  name: string;
  icon: string;
  tags: TagRecommendation[];
}

interface TrendingTag {
  tag: string;
  trendScore: number;
  category: string;
  growth: 'rising' | 'stable' | 'declining';
  relatedTerms: string[];
}

interface TagScore {
  tag: string;
  relevancyScore: number;
  competitionScore: number;
  optimizationScore: number;
  issues: string[];
  suggestions: string[];
}

interface ScoreResult {
  totalScore: number;
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

export default function TagRecommenderPage() {
  // Input
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [locale, setLocale] = useState('en');

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recommendations
  const [recommendations, setRecommendations] = useState<TagRecommendation[]>([]);
  const [groups, setGroups] = useState<TagGroup[]>([]);

  // Trending
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [trendingCategory, setTrendingCategory] = useState('background-removal');

  // Selected tags
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Score
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [calculatingScore, setCalculatingScore] = useState(false);

  // Fetch recommendations
  const fetchRecommendations = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendations([]);
    setGroups([]);
    setSelectedTags(new Set());
    setScoreResult(null);

    try {
      const response = await fetch('/api/admin/seo/tags/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, locale }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.tags || []);
      setGroups(data.groups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch trending tags
  const fetchTrending = async () => {
    setLoadingTrending(true);

    try {
      const response = await fetch(
        `/api/admin/seo/tags/trending?category=${trendingCategory}&locale=${locale}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch trending tags');
      }

      const data = await response.json();
      setTrendingTags(data.tags || []);
    } catch (err) {
      console.error('Trending error:', err);
    } finally {
      setLoadingTrending(false);
    }
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        if (next.size < 30) {
          next.add(tag);
        }
      }
      return next;
    });
    setScoreResult(null); // Reset score when selection changes
  };

  // Select all in group
  const selectAllInGroup = (tags: TagRecommendation[]) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      for (const t of tags) {
        if (next.size < 30) {
          next.add(t.tag);
        }
      }
      return next;
    });
  };

  // Calculate score
  const calculateScore = async () => {
    if (selectedTags.size === 0 || !title.trim()) return;

    setCalculatingScore(true);

    try {
      const response = await fetch('/api/admin/seo/tags/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: Array.from(selectedTags),
          title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate score');
      }

      const data = await response.json();
      setScoreResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate score');
    } finally {
      setCalculatingScore(false);
    }
  };

  // Copy tags to clipboard
  const copyTags = () => {
    const tagsText = Array.from(selectedTags).join(', ');
    navigator.clipboard.writeText(tagsText);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Get intent icon
  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'informational': return 'ℹ️';
      case 'navigational': return '🧭';
      case 'transactional': return '💰';
      case 'commercial': return '🔍';
      default: return '❓';
    }
  };

  // Get grade color
  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    if (grade === 'D') return 'text-orange-400';
    return 'text-red-400';
  };

  // Get growth icon
  const getGrowthIcon = (growth: string) => {
    switch (growth) {
      case 'rising': return '📈';
      case 'stable': return '➡️';
      case 'declining': return '📉';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🏷️</span> Tag Recommender
          </h1>
          <p className="text-gray-400">
            VidIQ-style tag recommendations with AI analysis
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Article Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchRecommendations()}
              placeholder="e.g., How to Remove Background from Photos Using AI"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Locale */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Target Locale
            </label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            >
              <option value="en">🇺🇸 English</option>
              <option value="pl">🇵🇱 Polish</option>
              <option value="de">🇩🇪 German</option>
              <option value="fr">🇫🇷 French</option>
              <option value="es">🇪🇸 Spanish</option>
            </select>
          </div>
        </div>

        {/* Content (optional) */}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-400 mb-2">
            Article Content (optional, for better recommendations)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your article content here for more accurate tag recommendations..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchRecommendations}
            disabled={loading || !title.trim()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                <span>🏷️</span> Get Tag Recommendations
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Recommendations */}
        <div className="xl:col-span-2 space-y-6">
          {/* Grouped Recommendations */}
          {groups.length > 0 && (
            <div className="space-y-4">
              {groups.map(group => (
                <div
                  key={group.name}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span>{group.icon}</span>
                      <span>{group.name}</span>
                      <span className="text-xs text-gray-500">({group.tags.length})</span>
                    </h3>
                    <button
                      onClick={() => selectAllInGroup(group.tags)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Select All
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {group.tags.map(tag => (
                      <button
                        key={tag.tag}
                        onClick={() => toggleTag(tag.tag)}
                        className={`group relative px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${
                          selectedTags.has(tag.tag)
                            ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                            : 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <span>{tag.tag}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getDifficultyColor(tag.difficulty)}`}>
                          {tag.relevancyScore}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs whitespace-nowrap shadow-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-1.5 py-0.5 rounded ${getDifficultyColor(tag.difficulty)}`}>
                                {tag.difficulty}
                              </span>
                              <span>{getIntentIcon(tag.searchIntent)} {tag.searchIntent}</span>
                            </div>
                            <div className="text-gray-400">Source: {tag.source}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trending Tags */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <span>📈</span>
                <span>Trending in Niche</span>
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={trendingCategory}
                  onChange={(e) => setTrendingCategory(e.target.value)}
                  className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white"
                >
                  <option value="background-removal">Background Removal</option>
                  <option value="image-upscaling">Image Upscaling</option>
                  <option value="photo-editing">Photo Editing</option>
                  <option value="ai-tools">AI Tools</option>
                  <option value="general">General</option>
                </select>
                <button
                  onClick={fetchTrending}
                  disabled={loadingTrending}
                  className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition"
                >
                  {loadingTrending ? '...' : 'Refresh'}
                </button>
              </div>
            </div>

            {trendingTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {trendingTags.slice(0, 20).map(tag => (
                  <button
                    key={tag.tag}
                    onClick={() => toggleTag(tag.tag)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-2 ${
                      selectedTags.has(tag.tag)
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                        : 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span>{getGrowthIcon(tag.growth)}</span>
                    <span>{tag.tag}</span>
                    <span className="text-xs text-gray-500">{tag.trendScore}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                Click &quot;Refresh&quot; to load trending tags
              </p>
            )}
          </div>
        </div>

        {/* Right: Selected Tags & Score */}
        <div className="space-y-4">
          {/* Selected Tags Panel */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Selected: {selectedTags.size}/30
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={copyTags}
                  disabled={selectedTags.size === 0}
                  className="text-xs text-gray-400 hover:text-white disabled:opacity-50"
                >
                  📋 Copy
                </button>
                <button
                  onClick={() => setSelectedTags(new Set())}
                  disabled={selectedTags.size === 0}
                  className="text-xs text-gray-400 hover:text-white disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2 mb-4 max-h-48 overflow-y-auto">
              {Array.from(selectedTags).map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="hover:text-white"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            {/* Calculate Score Button */}
            <button
              onClick={calculateScore}
              disabled={calculatingScore || selectedTags.size === 0 || !title.trim()}
              className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              {calculatingScore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <span>📊</span> Calculate Score
                </>
              )}
            </button>
          </div>

          {/* Score Result */}
          {scoreResult && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              {/* Big Score */}
              <div className="text-center mb-4">
                <div className="text-5xl font-bold mb-1">
                  {scoreResult.totalScore}
                  <span className="text-lg text-gray-500">/{scoreResult.maxPossibleScore}</span>
                </div>
                <div className={`text-3xl font-bold ${getGradeColor(scoreResult.grade)}`}>
                  Grade: {scoreResult.grade}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {scoreResult.percentage}% optimized
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-gray-900 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {scoreResult.summary.averageRelevancy}%
                  </div>
                  <div className="text-xs text-gray-400">Avg Relevancy</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-orange-400">
                    {scoreResult.summary.averageCompetition}%
                  </div>
                  <div className="text-xs text-gray-400">Avg Competition</div>
                </div>
              </div>

              {/* Recommendations */}
              {scoreResult.summary.recommendations.length > 0 && (
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    💡 Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {scoreResult.summary.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-yellow-400">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tag Breakdown */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">
                  Tag Breakdown
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {scoreResult.tagScores.slice(0, 10).map(ts => (
                    <div
                      key={ts.tag}
                      className="flex items-center justify-between text-sm bg-gray-900 rounded-lg p-2"
                    >
                      <span className="text-gray-300 truncate flex-1">{ts.tag}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded ${
                        ts.optimizationScore >= 70 ? 'bg-green-500/20 text-green-400' :
                        ts.optimizationScore >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {ts.optimizationScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips */}
      {recommendations.length === 0 && !loading && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">
            How to Use Tag Recommender
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">1.</span>
              <span>Enter your article title to get AI-powered tag recommendations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">2.</span>
              <span>Optionally paste your content for more accurate suggestions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">3.</span>
              <span>Select tags from recommendations - aim for 15-30 tags</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">4.</span>
              <span>Calculate your score to see how well optimized your tags are</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">5.</span>
              <span>Mix highly relevant tags with low competition gems for best results</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
