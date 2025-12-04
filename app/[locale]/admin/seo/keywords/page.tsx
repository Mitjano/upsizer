"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Locale {
  code: string;
  name: string;
  flag: string;
  isActive: boolean;
}

interface LocaleResult {
  locale: string;
  flag: string;
  suggestions: string[];
  questions?: string[];
  longTails?: string[];
  allKeywords?: string[];
  error?: string;
}

interface KeywordResearchResponse {
  success: boolean;
  keyword: string;
  results: Record<string, LocaleResult>;
  summary: {
    localesSearched: number;
    totalUniqueKeywords: number;
    keywordsByLocale: Record<string, number>;
  };
}

interface DifficultyResult {
  keyword: string;
  locale: string;
  difficulty: number;
  difficultyLabel: 'easy' | 'medium' | 'hard' | 'very_hard';
  factors: {
    serpCompetition: number;
    contentQuality: number;
    serpFeatures: number;
    marketCompetitiveness: number;
    totalResults: number;
  };
  topDomains: string[];
  hasFeatures: string[];
  estimatedEffort: string;
  recommendation: string;
}

type SearchIntent = 'informational' | 'navigational' | 'transactional' | 'commercial';

interface IntentResult {
  keyword: string;
  intent: SearchIntent;
  confidence: number;
  reasoning: string;
  suggestions: string[];
}

export default function KeywordResearchPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [locales, setLocales] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Research form
  const [seedKeyword, setSeedKeyword] = useState('');
  const [selectedLocales, setSelectedLocales] = useState<string[]>(['en']);
  const [researchType, setResearchType] = useState<'full' | 'suggestions' | 'questions' | 'longtail'>('full');

  // Results
  const [results, setResults] = useState<KeywordResearchResponse | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  // Difficulty scoring
  const [checkingDifficulty, setCheckingDifficulty] = useState(false);
  const [difficultyScores, setDifficultyScores] = useState<Record<string, DifficultyResult>>({});
  const [showDifficultyPanel, setShowDifficultyPanel] = useState(false);

  // Search Intent
  const [checkingIntent, setCheckingIntent] = useState(false);
  const [intentScores, setIntentScores] = useState<Record<string, IntentResult>>({});
  const [showIntentPanel, setShowIntentPanel] = useState(false);

  // Keyword Magic
  const [expandingKeyword, setExpandingKeyword] = useState(false);
  const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
  const [showMagicPanel, setShowMagicPanel] = useState(false);

  useEffect(() => {
    fetchLocales();
  }, []);

  const fetchLocales = async () => {
    try {
      const response = await fetch('/api/admin/seo/locales');
      if (!response.ok) throw new Error('Failed to fetch locales');
      const data = await response.json();
      setLocales(data);
      // Set default to first active locale
      const firstActive = data.find((l: Locale) => l.isActive);
      if (firstActive) setSelectedLocales([firstActive.code]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocale = (code: string) => {
    setSelectedLocales(prev => {
      if (prev.includes(code)) {
        // Don't allow deselecting the last locale
        if (prev.length === 1) return prev;
        return prev.filter(l => l !== code);
      }
      return [...prev, code];
    });
  };

  const selectAllLocales = () => {
    setSelectedLocales(locales.filter(l => l.isActive).map(l => l.code));
  };

  const selectTopLocales = () => {
    // Select top 5 markets: EN, DE, FR, ES, PL
    const topLocales = ['en', 'de', 'fr', 'es', 'pl'];
    setSelectedLocales(topLocales.filter(l => locales.find(loc => loc.code === l && loc.isActive)));
  };

  const handleResearch = async () => {
    if (!seedKeyword.trim() || selectedLocales.length === 0) return;

    setResearching(true);
    setResults(null);
    setSelectedKeywords(new Set());
    setError(null);
    setActiveTab('all');

    try {
      const response = await fetch('/api/admin/seo/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: seedKeyword.trim(),
          locales: selectedLocales,
          type: researchType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to research keyword');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setResearching(false);
    }
  };

  // Get all keywords across all locales
  const getAllKeywords = (): string[] => {
    if (!results) return [];
    const allKeywords = new Set<string>();
    Object.values(results.results).forEach(r => {
      r.suggestions?.forEach(s => allKeywords.add(s));
      r.questions?.forEach(q => allKeywords.add(q));
      r.longTails?.forEach(l => allKeywords.add(l));
    });
    return Array.from(allKeywords).sort();
  };

  // Get keywords for specific locale
  const getLocaleKeywords = (localeCode: string): { suggestions: string[]; questions: string[]; longTails: string[] } => {
    if (!results || !results.results[localeCode]) {
      return { suggestions: [], questions: [], longTails: [] };
    }
    const r = results.results[localeCode];
    return {
      suggestions: r.suggestions || [],
      questions: r.questions || [],
      longTails: r.longTails || [],
    };
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  };

  const selectAll = (keywords: string[]) => {
    setSelectedKeywords(prev => {
      const next = new Set(prev);
      keywords.forEach(k => next.add(k));
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedKeywords(new Set());
  };

  const handleAddToTracker = async () => {
    if (selectedKeywords.size === 0) return;

    try {
      // Add each keyword to tracker
      for (const keyword of selectedKeywords) {
        const difficultyData = difficultyScores[keyword];
        await fetch('/api/admin/seo/keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            domain: 'pixelift.pl',
            locales: selectedLocales,
            priority: difficultyData?.difficultyLabel === 'easy' ? 'high' : 'medium',
            tags: ['discovered'],
            difficulty: difficultyData?.difficulty,
          }),
        });
      }

      alert(`Added ${selectedKeywords.size} keywords to Rank Tracker!`);
      setSelectedKeywords(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add keywords');
    }
  };

  // Check difficulty for selected keywords
  const checkDifficulty = async () => {
    if (selectedKeywords.size === 0) return;

    setCheckingDifficulty(true);
    setShowDifficultyPanel(true);

    try {
      const keywordsArray = Array.from(selectedKeywords).slice(0, 10); // Limit to 10
      const response = await fetch('/api/admin/seo/keywords/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywordsArray,
          locale: selectedLocales[0] || 'en', // Use first selected locale
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check difficulty');
      }

      const data = await response.json();

      // Store results by keyword
      const newScores: Record<string, DifficultyResult> = { ...difficultyScores };
      for (const result of data.results) {
        newScores[result.keyword] = result;
      }
      setDifficultyScores(newScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check difficulty');
    } finally {
      setCheckingDifficulty(false);
    }
  };

  // Get difficulty badge color
  const getDifficultyColor = (label: string): string => {
    switch (label) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'hard': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'very_hard': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Get difficulty emoji
  const getDifficultyEmoji = (label: string): string => {
    switch (label) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🟠';
      case 'very_hard': return '🔴';
      default: return '⚪';
    }
  };

  // Check intent for selected keywords
  const checkIntent = async () => {
    if (selectedKeywords.size === 0) return;

    setCheckingIntent(true);
    setShowIntentPanel(true);

    try {
      const keywordsArray = Array.from(selectedKeywords).slice(0, 20);
      const response = await fetch('/api/admin/seo/keywords/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywordsArray }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze intent');
      }

      const data = await response.json();

      // Store results by keyword
      const newScores: Record<string, IntentResult> = { ...intentScores };
      for (const result of data.results) {
        newScores[result.keyword] = result;
      }
      setIntentScores(newScores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze intent');
    } finally {
      setCheckingIntent(false);
    }
  };

  // Get intent color
  const getIntentColor = (intent: SearchIntent): string => {
    switch (intent) {
      case 'informational': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'navigational': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'transactional': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'commercial': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Get intent emoji
  const getIntentEmoji = (intent: SearchIntent): string => {
    switch (intent) {
      case 'informational': return 'ℹ️';
      case 'navigational': return '🧭';
      case 'transactional': return '💰';
      case 'commercial': return '🔍';
      default: return '❓';
    }
  };

  // Keyword Magic - expand a keyword into many variations
  const expandKeyword = async (keywordToExpand: string) => {
    if (!keywordToExpand) return;

    setExpandingKeyword(true);
    setShowMagicPanel(true);
    setExpandedKeywords([]);

    try {
      const response = await fetch('/api/admin/seo/keywords/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keywordToExpand,
          locale: selectedLocales[0] || 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to expand keyword');
      }

      const data = await response.json();
      setExpandedKeywords(data.variations.map((v: { keyword: string }) => v.keyword));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to expand keyword');
    } finally {
      setExpandingKeyword(false);
    }
  };

  const renderKeywordList = (title: string, keywords: string[], icon: string, color: string) => {
    if (!keywords || keywords.length === 0) return null;

    const allSelected = keywords.every(k => selectedKeywords.has(k));

    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>{icon}</span>
            <span>{title}</span>
            <span className={`text-sm ${color} bg-black/20 px-2 py-0.5 rounded`}>
              {keywords.length}
            </span>
          </h3>
          <button
            onClick={() => allSelected ? keywords.forEach(k => {
              setSelectedKeywords(prev => {
                const next = new Set(prev);
                next.delete(k);
                return next;
              });
            }) : selectAll(keywords)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {keywords.map(keyword => {
            const difficulty = difficultyScores[keyword];
            const intent = intentScores[keyword];
            return (
              <label
                key={keyword}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
                  selectedKeywords.has(keyword)
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'hover:bg-gray-700/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedKeywords.has(keyword)}
                  onChange={() => toggleKeyword(keyword)}
                  className="w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-gray-700"
                />
                <span className="text-sm text-gray-300 flex-1">{keyword}</span>
                {intent && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${getIntentColor(intent.intent)}`} title={intent.reasoning}>
                    {getIntentEmoji(intent.intent)}
                  </span>
                )}
                {difficulty && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${getDifficultyColor(difficulty.difficultyLabel)}`}>
                    {getDifficultyEmoji(difficulty.difficultyLabel)} {difficulty.difficulty}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/${locale}/admin/seo`}
              className="text-gray-400 hover:text-white transition"
            >
              SEO Hub
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-3xl font-bold">Keyword Research</h1>
          </div>
          <p className="text-gray-400">
            Discover new keywords using Google Suggest
          </p>
        </div>
      </div>

      {/* Research Form */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Keyword & Type */}
          <div className="space-y-4">
            {/* Seed Keyword */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Seed Keyword
              </label>
              <input
                type="text"
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                placeholder="e.g., remove background"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Research Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Research Type
              </label>
              <select
                value={researchType}
                onChange={(e) => setResearchType(e.target.value as typeof researchType)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                <option value="full">Full Research</option>
                <option value="suggestions">Basic Suggestions</option>
                <option value="questions">Question Keywords</option>
                <option value="longtail">Long-tail Keywords</option>
              </select>
            </div>
          </div>

          {/* Right: Multi-Locale Selection */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-400">
                Locales ({selectedLocales.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectTopLocales}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Top 5
                </button>
                <button
                  onClick={selectAllLocales}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedLocales(['en'])}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 p-3 bg-gray-900 border border-gray-700 rounded-xl max-h-32 overflow-y-auto">
              {locales.filter(l => l.isActive).map(loc => (
                <button
                  key={loc.code}
                  onClick={() => toggleLocale(loc.code)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1.5 ${
                    selectedLocales.includes(loc.code)
                      ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
                      : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <span>{loc.flag}</span>
                  <span>{loc.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleResearch}
            disabled={researching || !seedKeyword.trim() || selectedLocales.length === 0}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center gap-2"
          >
            {researching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Researching {selectedLocales.length} locales...
              </>
            ) : (
              <>
                <span>🔍</span> Research in {selectedLocales.length} locale{selectedLocales.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Results for &quot;{results.keyword}&quot;
              </h2>
              <p className="text-sm text-gray-400">
                Found {results.summary.totalUniqueKeywords} unique keywords across {results.summary.localesSearched} locale{results.summary.localesSearched > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {selectedKeywords.size} selected
              </span>
              {selectedKeywords.size > 0 && (
                <>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Clear
                  </button>
                  <button
                    onClick={checkIntent}
                    disabled={checkingIntent || selectedKeywords.size > 20}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center gap-2"
                    title={selectedKeywords.size > 20 ? 'Select max 20 keywords' : ''}
                  >
                    {checkingIntent ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <span>🎯</span> Analyze Intent
                      </>
                    )}
                  </button>
                  <button
                    onClick={checkDifficulty}
                    disabled={checkingDifficulty || selectedKeywords.size > 10}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center gap-2"
                    title={selectedKeywords.size > 10 ? 'Select max 10 keywords' : ''}
                  >
                    {checkingDifficulty ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Checking...
                      </>
                    ) : (
                      <>
                        <span>📊</span> Check Difficulty
                      </>
                    )}
                  </button>
                  {selectedKeywords.size === 1 && (
                    <button
                      onClick={() => expandKeyword(Array.from(selectedKeywords)[0])}
                      disabled={expandingKeyword}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center gap-2"
                    >
                      {expandingKeyword ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Expanding...
                        </>
                      ) : (
                        <>
                          <span>✨</span> Magic Expand
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={handleAddToTracker}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    <span>+</span> Add to Tracker
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Keyword Magic Panel */}
          {showMagicPanel && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                  <span>✨</span> Keyword Magic - Expanded Variations
                  {expandedKeywords.length > 0 && (
                    <span className="text-sm bg-cyan-500/20 px-2 py-0.5 rounded">
                      {expandedKeywords.length} keywords
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setShowMagicPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {expandingKeyword ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                  <span className="ml-3 text-gray-400">Generating variations...</span>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto mb-4">
                    {expandedKeywords.map(kw => (
                      <button
                        key={kw}
                        onClick={() => toggleKeyword(kw)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${
                          selectedKeywords.has(kw)
                            ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                            : 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectAll(expandedKeywords)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(expandedKeywords.join('\n'));
                      }}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1"
                    >
                      Copy All
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Difficulty Panel */}
          {showDifficultyPanel && Object.keys(difficultyScores).length > 0 && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
                  <span>📊</span> Keyword Difficulty Analysis
                </h3>
                <button
                  onClick={() => setShowDifficultyPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Object.values(difficultyScores).filter(d => d.difficultyLabel === 'easy').length}
                  </div>
                  <div className="text-xs text-gray-400">🟢 Easy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {Object.values(difficultyScores).filter(d => d.difficultyLabel === 'medium').length}
                  </div>
                  <div className="text-xs text-gray-400">🟡 Medium</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {Object.values(difficultyScores).filter(d => d.difficultyLabel === 'hard').length}
                  </div>
                  <div className="text-xs text-gray-400">🟠 Hard</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {Object.values(difficultyScores).filter(d => d.difficultyLabel === 'very_hard').length}
                  </div>
                  <div className="text-xs text-gray-400">🔴 Very Hard</div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.values(difficultyScores)
                  .sort((a, b) => a.difficulty - b.difficulty)
                  .map(result => (
                    <div
                      key={result.keyword}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white">{result.keyword}</div>
                        <div className="text-xs text-gray-400">{result.recommendation}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            result.difficultyLabel === 'easy' ? 'text-green-400' :
                            result.difficultyLabel === 'medium' ? 'text-yellow-400' :
                            result.difficultyLabel === 'hard' ? 'text-orange-400' : 'text-red-400'
                          }`}>
                            {result.difficulty}
                          </div>
                          <div className="text-xs text-gray-500">{result.estimatedEffort} effort</div>
                        </div>
                        <span className={`px-3 py-1 rounded-lg border text-sm ${getDifficultyColor(result.difficultyLabel)}`}>
                          {getDifficultyEmoji(result.difficultyLabel)} {result.difficultyLabel.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                <div className="flex gap-4 flex-wrap">
                  <span>🟢 Easy (0-30): Quick wins</span>
                  <span>🟡 Medium (31-50): Achievable</span>
                  <span>🟠 Hard (51-70): Requires effort</span>
                  <span>🔴 Very Hard (71-100): Very competitive</span>
                </div>
              </div>
            </div>
          )}

          {/* Intent Panel */}
          {showIntentPanel && Object.keys(intentScores).length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                  <span>🎯</span> Search Intent Analysis
                </h3>
                <button
                  onClick={() => setShowIntentPanel(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {Object.values(intentScores).filter(i => i.intent === 'informational').length}
                  </div>
                  <div className="text-xs text-gray-400">ℹ️ Informational</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {Object.values(intentScores).filter(i => i.intent === 'navigational').length}
                  </div>
                  <div className="text-xs text-gray-400">🧭 Navigational</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Object.values(intentScores).filter(i => i.intent === 'transactional').length}
                  </div>
                  <div className="text-xs text-gray-400">💰 Transactional</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {Object.values(intentScores).filter(i => i.intent === 'commercial').length}
                  </div>
                  <div className="text-xs text-gray-400">🔍 Commercial</div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.values(intentScores)
                  .sort((a, b) => b.confidence - a.confidence)
                  .map(result => (
                    <div
                      key={result.keyword}
                      className="p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-white flex-1">{result.keyword}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{result.confidence}% confidence</span>
                          <span className={`px-3 py-1 rounded-lg border text-sm ${getIntentColor(result.intent)}`}>
                            {getIntentEmoji(result.intent)} {result.intent}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">{result.reasoning}</div>
                      <div className="flex flex-wrap gap-1">
                        {result.suggestions.map((s, i) => (
                          <span key={i} className="text-xs bg-gray-700/50 px-2 py-1 rounded text-gray-300">
                            💡 {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500">
                <div className="flex gap-4 flex-wrap">
                  <span>ℹ️ Informational: Learning</span>
                  <span>🧭 Navigational: Find website</span>
                  <span>💰 Transactional: Buy now</span>
                  <span>🔍 Commercial: Research</span>
                </div>
              </div>
            </div>
          )}

          {/* Locale Tabs */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-700 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                  activeTab === 'all'
                    ? 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                🌍 All ({results.summary.totalUniqueKeywords})
              </button>
              {Object.entries(results.results).map(([code, data]) => (
                <button
                  key={code}
                  onClick={() => setActiveTab(code)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
                    activeTab === code
                      ? 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <span>{data.flag}</span>
                  <span>{code.toUpperCase()}</span>
                  <span className="text-xs opacity-60">
                    ({results.summary.keywordsByLocale[code] || 0})
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'all' ? (
                <>
                  {/* All Keywords Combined */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span>📋</span>
                        <span>All Unique Keywords</span>
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => selectAll(getAllKeywords())}
                          className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(getAllKeywords().join('\n'));
                          }}
                          className="text-xs text-gray-400 hover:text-white px-2 py-1"
                        >
                          Copy All
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                      {getAllKeywords().map(keyword => (
                        <button
                          key={keyword}
                          onClick={() => toggleKeyword(keyword)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition ${
                            selectedKeywords.has(keyword)
                              ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                              : 'bg-gray-700/50 border border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Locale-specific Results */}
                  {results.results[activeTab]?.error ? (
                    <div className="text-red-400 text-center py-8">
                      Error: {results.results[activeTab].error}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {renderKeywordList(
                        'Suggestions',
                        getLocaleKeywords(activeTab).suggestions,
                        '💡',
                        'text-blue-400'
                      )}
                      {renderKeywordList(
                        'Question Keywords',
                        getLocaleKeywords(activeTab).questions,
                        '❓',
                        'text-purple-400'
                      )}
                      {renderKeywordList(
                        'Long-tail Keywords',
                        getLocaleKeywords(activeTab).longTails,
                        '📈',
                        'text-green-400'
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Tips */}
      {!results && !researching && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">Tips for Keyword Research</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Start with broad keywords related to your product features (e.g., "remove background", "upscale image")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Use different locales to find region-specific keyword variations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Question keywords are great for blog content and FAQ pages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Long-tail keywords often have lower competition and higher conversion rates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Add discovered keywords to Rank Tracker to monitor your positions</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
