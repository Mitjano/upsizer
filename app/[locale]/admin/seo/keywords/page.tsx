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

interface KeywordResearchResult {
  keyword: string;
  locale: string;
  suggestions: string[];
  questions: string[];
  longTails: string[];
  allKeywords: string[];
  timestamp: string;
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
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [researchType, setResearchType] = useState<'full' | 'suggestions' | 'questions' | 'longtail'>('full');

  // Results
  const [results, setResults] = useState<KeywordResearchResult | null>(null);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

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
      if (firstActive) setSelectedLocale(firstActive.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleResearch = async () => {
    if (!seedKeyword.trim()) return;

    setResearching(true);
    setResults(null);
    setSelectedKeywords(new Set());

    try {
      const response = await fetch('/api/admin/seo/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: seedKeyword.trim(),
          locale: selectedLocale,
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
        await fetch('/api/admin/seo/keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            domain: 'pixelift.pl',
            locales: [selectedLocale],
            priority: 'medium',
            tags: ['discovered'],
          }),
        });
      }

      alert(`Added ${selectedKeywords.size} keywords to Rank Tracker!`);
      setSelectedKeywords(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add keywords');
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
          {keywords.map(keyword => (
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
              <span className="text-sm text-gray-300">{keyword}</span>
            </label>
          ))}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Seed Keyword */}
          <div className="md:col-span-2">
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

          {/* Locale */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Locale
            </label>
            <select
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
            >
              {locales.filter(l => l.isActive).map(loc => (
                <option key={loc.code} value={loc.code}>
                  {loc.flag} {loc.name}
                </option>
              ))}
            </select>
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

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleResearch}
            disabled={researching || !seedKeyword.trim()}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center gap-2"
          >
            {researching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Researching...
              </>
            ) : (
              <>
                <span>🔍</span> Research
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
                Results for "{results.keyword}"
                <span className="text-gray-400 text-sm ml-2">
                  ({locales.find(l => l.code === results.locale)?.flag} {results.locale.toUpperCase()})
                </span>
              </h2>
              <p className="text-sm text-gray-400">
                Found {results.allKeywords.length} unique keywords
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
                    onClick={handleAddToTracker}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    <span>+</span> Add to Tracker
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Keyword Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderKeywordList('Suggestions', results.suggestions, '💡', 'text-blue-400')}
            {renderKeywordList('Question Keywords', results.questions, '❓', 'text-purple-400')}
            {renderKeywordList('Long-tail Keywords', results.longTails, '📈', 'text-green-400')}
          </div>

          {/* All Keywords */}
          {results.allKeywords.length > 0 && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span>📋</span>
                  <span>All Unique Keywords</span>
                  <span className="text-sm text-cyan-400 bg-black/20 px-2 py-0.5 rounded">
                    {results.allKeywords.length}
                  </span>
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectAll(results.allKeywords)}
                    className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(results.allKeywords.join('\n'));
                      alert('Copied to clipboard!');
                    }}
                    className="text-xs text-gray-400 hover:text-white px-2 py-1"
                  >
                    Copy All
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                {results.allKeywords.map(keyword => (
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
          )}
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
