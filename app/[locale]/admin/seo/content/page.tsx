'use client';

import { useState, useCallback, useEffect } from 'react';

interface ContentScoreResult {
  totalScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
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

interface SERPAnalysis {
  benchmarks: {
    avgWordCount: number;
    wordCountRange: { min: number; max: number };
    avgHeadings: { h2: number; h3: number };
    contentTypes: { type: string; count: number }[];
  };
  patterns: {
    commonWords: { word: string; frequency: number }[];
    commonPhrases: { phrase: string; frequency: number }[];
    topicsCovered: string[];
    questionsAnswered: string[];
  };
  competitors: {
    url: string;
    title: string;
    position: number;
    domain: string;
  }[];
  recommendations: string[];
}

export default function ContentEditorPage() {
  // Input state
  const [keyword, setKeyword] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [scoreResult, setScoreResult] = useState<ContentScoreResult | null>(null);
  const [serpAnalysis, setSerpAnalysis] = useState<SERPAnalysis | null>(null);
  const [loadingSERP, setLoadingSERP] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-analyze on content change (debounced)
  const [autoAnalyze, setAutoAnalyze] = useState(false);

  // Analyze content
  const analyzeContent = useCallback(async () => {
    if (!content.trim() || !keyword.trim()) return;

    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/seo/content/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, keyword, title }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const data = await response.json();
      setScoreResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [content, keyword, title]);

  // Auto-analyze effect
  useEffect(() => {
    if (!autoAnalyze || !content.trim() || !keyword.trim()) return;

    const timeout = setTimeout(() => {
      analyzeContent();
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeout);
  }, [content, autoAnalyze, analyzeContent]);

  // Analyze SERP
  const analyzeSERP = async () => {
    if (!keyword.trim()) return;

    setLoadingSERP(true);

    try {
      const response = await fetch('/api/admin/seo/content/analyze-serp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze SERP');
      }

      const data = await response.json();
      setSerpAnalysis(data);
    } catch (err) {
      console.error('SERP analysis failed:', err);
    } finally {
      setLoadingSERP(false);
    }
  };

  // Get grade color
  const getGradeColor = (grade: string) => {
    if (grade === 'A+' || grade === 'A') return 'text-green-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    if (grade === 'D') return 'text-orange-400';
    return 'text-red-400';
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Count words in content
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>📝</span> Content Editor
          </h1>
          <p className="text-gray-400">
            Surfer SEO-style content optimization with real-time scoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-green-500"
            />
            <span className="text-gray-400">Auto-analyze</span>
          </label>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Editor */}
        <div className="xl:col-span-2 space-y-4">
          {/* Keyword & Title */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Target Keyword *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g., remove background from image"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={analyzeSERP}
                  disabled={loadingSERP || !keyword.trim()}
                  className="px-3 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 disabled:opacity-50"
                  title="Analyze competitor content"
                >
                  {loadingSERP ? '...' : '🔍'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                {title.length}/60 characters
                {title.length > 60 && <span className="text-red-400 ml-2">Too long!</span>}
              </div>
            </div>
          </div>

          {/* Meta Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Meta description for search results..."
              rows={2}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {metaDescription.length}/160 characters
              {metaDescription.length > 160 && <span className="text-red-400 ml-2">Too long!</span>}
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-400">
                Content
              </label>
              <span className="text-sm text-gray-500">
                {wordCount} words
                {scoreResult && (
                  <span className="ml-2">
                    (target: {scoreResult.analysis.targetWordCount.min}-{scoreResult.analysis.targetWordCount.max})
                  </span>
                )}
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or write your content here (HTML supported)..."
              rows={20}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-y font-mono text-sm"
            />
          </div>

          {/* Analyze Button */}
          <div className="flex justify-end">
            <button
              onClick={analyzeContent}
              disabled={analyzing || !content.trim() || !keyword.trim()}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>📊</span> Analyze Content
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Right: Score Panel */}
        <div className="space-y-4">
          {/* Main Score */}
          {scoreResult ? (
            <>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
                <div className="text-6xl font-bold mb-2">
                  {scoreResult.totalScore}
                </div>
                <div className={`text-3xl font-bold ${getGradeColor(scoreResult.grade)} mb-2`}>
                  {scoreResult.grade}
                </div>
                <div className="text-sm text-gray-400">Content Score</div>

                {/* Score Breakdown */}
                <div className="mt-6 space-y-3">
                  {Object.entries(scoreResult.scores).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-white">{value}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`${getScoreColor(value)} h-2 rounded-full transition-all`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analysis Details */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="font-semibold mb-3">📈 Analysis</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Word Count</span>
                    <span className={scoreResult.analysis.wordCount >= scoreResult.analysis.targetWordCount.min ? 'text-green-400' : 'text-red-400'}>
                      {scoreResult.analysis.wordCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Keyword Density</span>
                    <span className={
                      scoreResult.analysis.keywordDensity >= scoreResult.analysis.targetKeywordDensity.min &&
                      scoreResult.analysis.keywordDensity <= scoreResult.analysis.targetKeywordDensity.max
                        ? 'text-green-400' : 'text-yellow-400'
                    }>
                      {scoreResult.analysis.keywordDensity}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">H2 Headings</span>
                    <span>{scoreResult.analysis.headings.h2}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">H3 Headings</span>
                    <span>{scoreResult.analysis.headings.h3}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Images</span>
                    <span>{scoreResult.analysis.images}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Internal Links</span>
                    <span>{scoreResult.analysis.links.internal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Readability</span>
                    <span>{scoreResult.analysis.readabilityScore}</span>
                  </div>
                </div>
              </div>

              {/* NLP Terms */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="font-semibold mb-3">🧠 NLP Terms</h3>

                {scoreResult.nlpTerms.missing.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-red-400 mb-1">Missing (add these):</div>
                    <div className="flex flex-wrap gap-1">
                      {scoreResult.nlpTerms.missing.slice(0, 10).map(term => (
                        <span key={term} className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-xs">
                          + {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {scoreResult.nlpTerms.found.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-green-400 mb-1">Found:</div>
                    <div className="flex flex-wrap gap-1">
                      {scoreResult.nlpTerms.found.slice(0, 10).map(term => (
                        <span key={term} className="px-2 py-0.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-xs">
                          ✓ {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {scoreResult.nlpTerms.overused.length > 0 && (
                  <div>
                    <div className="text-xs text-yellow-400 mb-1">Overused:</div>
                    <div className="flex flex-wrap gap-1">
                      {scoreResult.nlpTerms.overused.map(term => (
                        <span key={term} className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded text-xs">
                          ⚠ {term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <h3 className="font-semibold mb-3">💡 Recommendations</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scoreResult.recommendations.slice(0, 10).map((rec, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border ${getPriorityColor(rec.priority)}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase">{rec.priority}</span>
                        <span className="text-xs text-gray-500">{rec.category}</span>
                      </div>
                      <div className="text-sm text-white">{rec.message}</div>
                      <div className="text-xs text-gray-400 mt-1">→ {rec.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-400">
                Enter your target keyword and content, then click &quot;Analyze Content&quot; to see your score.
              </p>
            </div>
          )}

          {/* SERP Analysis */}
          {serpAnalysis && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <h3 className="font-semibold mb-3">🎯 Competitor Insights</h3>

              <div className="space-y-3 text-sm">
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-gray-400 mb-1">Avg Word Count</div>
                  <div className="text-xl font-bold">{serpAnalysis.benchmarks.avgWordCount}</div>
                  <div className="text-xs text-gray-500">
                    Range: {serpAnalysis.benchmarks.wordCountRange.min} - {serpAnalysis.benchmarks.wordCountRange.max}
                  </div>
                </div>

                {serpAnalysis.patterns.topicsCovered.length > 0 && (
                  <div>
                    <div className="text-gray-400 mb-1">Topics to Cover:</div>
                    <div className="flex flex-wrap gap-1">
                      {serpAnalysis.patterns.topicsCovered.slice(0, 8).map(topic => (
                        <span key={topic} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {serpAnalysis.patterns.questionsAnswered.length > 0 && (
                  <div>
                    <div className="text-gray-400 mb-1">Questions to Answer:</div>
                    <ul className="space-y-1">
                      {serpAnalysis.patterns.questionsAnswered.slice(0, 5).map((q, i) => (
                        <li key={i} className="text-xs text-gray-300">• {q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <div className="text-gray-400 mb-1">Top Competitors:</div>
                  <div className="space-y-1">
                    {serpAnalysis.competitors.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">#{c.position}</span>
                        <span className="text-gray-300 truncate">{c.domain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SERP Preview */}
      {(title || metaDescription) && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold mb-4">🔍 SERP Preview</h3>
          <div className="max-w-2xl">
            <div className="text-blue-400 text-lg hover:underline cursor-pointer truncate">
              {title || 'Your Title Here'}
            </div>
            <div className="text-green-400 text-sm truncate">
              https://pixelift.pl/blog/{title ? title.toLowerCase().replace(/\s+/g, '-').slice(0, 50) : 'your-article'}
            </div>
            <div className="text-gray-400 text-sm mt-1 line-clamp-2">
              {metaDescription || 'Your meta description will appear here. Write a compelling description that includes your target keyword.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
