"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

interface Locale {
  code: string;
  name: string;
  flag: string;
  isActive: boolean;
}

interface Keyword {
  id: string;
  keyword: string;
  domain: string;
  localeCode: string;
  currentPosition: number | null;
  previousPosition: number | null;
  bestPosition: number | null;
  worstPosition: number | null;
  isActive: boolean;
  priority: string;
  tags: string[];
  targetUrl: string | null;
  groupId: string | null;
  lastChecked: string | null;
  history: Array<{
    id: string;
    position: number | null;
    checkedAt: string;
  }>;
}

interface GroupedKeyword {
  groupId: string;
  keyword: string;
  domain: string;
  locales: Record<string, Keyword>;
}

export default function RankTrackerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const showAddModal = searchParams.get('action') === 'add';

  const [locales, setLocales] = useState<Locale[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocales, setSelectedLocales] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(showAddModal);
  const [checking, setChecking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Add keyword form state
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordLocales, setNewKeywordLocales] = useState<string[]>([]);
  const [newKeywordDomain, setNewKeywordDomain] = useState('pixelift.pl');
  const [newKeywordPriority, setNewKeywordPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newKeywordTags, setNewKeywordTags] = useState('');
  const [addingKeyword, setAddingKeyword] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [localesRes, keywordsRes] = await Promise.all([
        fetch('/api/admin/seo/locales'),
        fetch('/api/admin/seo/keywords'),
      ]);

      if (!localesRes.ok || !keywordsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const localesData = await localesRes.json();
      const keywordsData = await keywordsRes.json();

      setLocales(localesData);
      setKeywords(keywordsData);

      // Set default selected locales to active ones
      const activeLocaleCodes = localesData
        .filter((l: Locale) => l.isActive)
        .map((l: Locale) => l.code);
      setSelectedLocales(activeLocaleCodes);
      setNewKeywordLocales(activeLocaleCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocale = (code: string) => {
    setSelectedLocales(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const toggleNewKeywordLocale = (code: string) => {
    setNewKeywordLocales(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  // Group keywords by groupId or by keyword+domain
  const groupedKeywords = useCallback((): GroupedKeyword[] => {
    const groups = new Map<string, GroupedKeyword>();

    for (const kw of keywords) {
      const groupKey = kw.groupId || `${kw.keyword}__${kw.domain}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          groupId: groupKey,
          keyword: kw.keyword,
          domain: kw.domain,
          locales: {},
        });
      }

      groups.get(groupKey)!.locales[kw.localeCode] = kw;
    }

    return Array.from(groups.values());
  }, [keywords]);

  // Filter grouped keywords
  const filteredGroups = groupedKeywords().filter(group => {
    // Check if any selected locale has this keyword
    const hasSelectedLocale = selectedLocales.some(
      localeCode => group.locales[localeCode]
    );
    if (!hasSelectedLocale) return false;

    // Search filter
    if (searchTerm) {
      return group.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    }

    return true;
  });

  const getPositionColor = (position: number | null): string => {
    if (position === null) return 'text-gray-500';
    if (position <= 3) return 'text-green-400';
    if (position <= 10) return 'text-blue-400';
    if (position <= 20) return 'text-yellow-400';
    if (position <= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getChangeIcon = (current: number | null, previous: number | null): string => {
    if (current === null || previous === null) return '';
    if (current < previous) return '↑';
    if (current > previous) return '↓';
    return '→';
  };

  const getChangeColor = (current: number | null, previous: number | null): string => {
    if (current === null || previous === null) return 'text-gray-400';
    if (current < previous) return 'text-green-400';
    if (current > previous) return 'text-red-400';
    return 'text-gray-400';
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || newKeywordLocales.length === 0) return;

    setAddingKeyword(true);
    try {
      const response = await fetch('/api/admin/seo/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newKeyword.trim(),
          domain: newKeywordDomain,
          locales: newKeywordLocales,
          priority: newKeywordPriority,
          tags: newKeywordTags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add keyword');
      }

      // Reset form and refresh
      setNewKeyword('');
      setNewKeywordTags('');
      setIsAddModalOpen(false);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add keyword');
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleCheckPositions = async (keywordIds?: string[]) => {
    setChecking(true);
    try {
      const response = await fetch('/api/admin/seo/keywords/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          keywordIds ? { keywordIds } : { checkAll: true }
        ),
      });

      if (!response.ok) throw new Error('Failed to check positions');

      const data = await response.json();
      alert(`Position check complete! Checked ${data.checked} keywords, ${data.found} ranking.`);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to check positions');
    } finally {
      setChecking(false);
    }
  };

  const handleDeleteKeyword = async (keywordId: string) => {
    if (!confirm('Are you sure you want to delete this keyword?')) return;

    try {
      const response = await fetch(`/api/admin/seo/keywords?id=${keywordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete keyword');
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete keyword');
    }
  };

  // Stats for selected locales
  const stats = {
    total: filteredGroups.length,
    ranking: filteredGroups.filter(g =>
      selectedLocales.some(l => g.locales[l]?.currentPosition !== null)
    ).length,
    top10: filteredGroups.filter(g =>
      selectedLocales.some(l => {
        const pos = g.locales[l]?.currentPosition;
        return pos !== null && pos <= 10;
      })
    ).length,
    improved: filteredGroups.filter(g =>
      selectedLocales.some(l => {
        const kw = g.locales[l];
        return kw?.currentPosition !== null && kw?.previousPosition !== null && kw.currentPosition < kw.previousPosition;
      })
    ).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
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
            <h1 className="text-3xl font-bold">Rank Tracker</h1>
          </div>
          <p className="text-gray-400">
            Monitor keyword positions across {locales.filter(l => l.isActive).length} locales
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleCheckPositions()}
            disabled={checking}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            {checking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Checking...
              </>
            ) : (
              <>
                <span>🔄</span> Check All
              </>
            )}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <span>+</span> Add Keyword
          </button>
        </div>
      </div>

      {/* Locale Selector */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-gray-400 font-semibold">Filter by locale:</span>
          {locales.filter(l => l.isActive).map(loc => (
            <button
              key={loc.code}
              onClick={() => toggleLocale(loc.code)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition ${
                selectedLocales.includes(loc.code)
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                  : 'bg-gray-700/50 border border-gray-600 text-gray-400 hover:text-white'
              }`}
            >
              <span>{loc.flag}</span>
              <span className="text-sm font-medium">{loc.code.toUpperCase()}</span>
            </button>
          ))}
          <button
            onClick={() => setSelectedLocales(locales.filter(l => l.isActive).map(l => l.code))}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Select All
          </button>
          <button
            onClick={() => setSelectedLocales([])}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 border border-gray-500/30 rounded-xl p-4">
          <div className="text-sm text-gray-400 font-semibold mb-1">Total Keywords</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4">
          <div className="text-sm text-blue-400 font-semibold mb-1">Ranking</div>
          <div className="text-3xl font-bold text-white">{stats.ranking}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4">
          <div className="text-sm text-green-400 font-semibold mb-1">Top 10</div>
          <div className="text-3xl font-bold text-white">{stats.top10}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-xl p-4">
          <div className="text-sm text-emerald-400 font-semibold mb-1">Improved</div>
          <div className="text-3xl font-bold text-white">{stats.improved}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
      </div>

      {/* Keywords Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-400">Keyword</th>
                {selectedLocales.map(code => {
                  const loc = locales.find(l => l.code === code);
                  return (
                    <th key={code} className="text-center px-4 py-3 text-sm font-semibold text-gray-400">
                      {loc?.flag} {code.toUpperCase()}
                    </th>
                  );
                })}
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={selectedLocales.length + 2} className="px-4 py-12 text-center text-gray-500">
                    No keywords found. Add your first keyword to start tracking!
                  </td>
                </tr>
              ) : (
                filteredGroups.map(group => (
                  <tr key={group.groupId} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{group.keyword}</div>
                      <div className="text-xs text-gray-500">{group.domain}</div>
                    </td>
                    {selectedLocales.map(code => {
                      const kw = group.locales[code];
                      if (!kw) {
                        return (
                          <td key={code} className="text-center px-4 py-3">
                            <span className="text-gray-600">—</span>
                          </td>
                        );
                      }
                      return (
                        <td key={code} className="text-center px-4 py-3">
                          <div className="flex flex-col items-center">
                            <span className={`text-xl font-bold ${getPositionColor(kw.currentPosition)}`}>
                              {kw.currentPosition !== null ? `#${kw.currentPosition}` : '—'}
                            </span>
                            {kw.previousPosition !== null && kw.currentPosition !== null && (
                              <span className={`text-xs ${getChangeColor(kw.currentPosition, kw.previousPosition)}`}>
                                {getChangeIcon(kw.currentPosition, kw.previousPosition)}
                                {Math.abs(kw.currentPosition - kw.previousPosition)}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="text-center px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            const ids = selectedLocales
                              .map(code => group.locales[code]?.id)
                              .filter(Boolean) as string[];
                            if (ids.length > 0) handleCheckPositions(ids);
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition"
                          title="Check position"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => {
                            const firstKw = Object.values(group.locales)[0];
                            if (firstKw) handleDeleteKeyword(firstKw.id);
                          }}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Keyword Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Add Keyword</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Keyword */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Keyword *
                </label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g., remove background from image"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Domain */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  value={newKeywordDomain}
                  onChange={(e) => setNewKeywordDomain(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Locales */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Track in locales *
                </label>
                <div className="flex flex-wrap gap-2">
                  {locales.filter(l => l.isActive).map(loc => (
                    <button
                      key={loc.code}
                      onClick={() => toggleNewKeywordLocale(loc.code)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                        newKeywordLocales.includes(loc.code)
                          ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                          : 'bg-gray-700/50 border border-gray-600 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>{loc.flag}</span>
                      <span className="text-sm">{loc.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewKeywordPriority(p)}
                      className={`flex-1 px-3 py-2 rounded-lg capitalize transition ${
                        newKeywordPriority === p
                          ? p === 'high' ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                          : p === 'medium' ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                          : 'bg-gray-500/20 border border-gray-500/50 text-gray-400'
                          : 'bg-gray-700/50 border border-gray-600 text-gray-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newKeywordTags}
                  onChange={(e) => setNewKeywordTags(e.target.value)}
                  placeholder="e.g., product, feature, competitor"
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddKeyword}
                disabled={addingKeyword || !newKeyword.trim() || newKeywordLocales.length === 0}
                className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {addingKeyword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </>
                ) : (
                  'Add Keyword'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
