"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface SEOStats {
  overview: {
    totalKeywords: number;
    keywordsRanking: number;
    avgPosition: number | null;
    activeLocales: number;
    totalBacklinks: number;
    lastAuditScore: number | null;
    lastAuditDate: string | null;
  };
  distribution: {
    top3: number;
    top10: number;
    top20: number;
    top50: number;
    top100: number;
    notRanking: number;
  };
  recentChanges: {
    improved: number;
    declined: number;
    stable: number;
    new: number;
    lost: number;
  };
  localeStats: Array<{
    code: string;
    name: string;
    flag: string;
    keywordCount: number;
  }>;
}

export default function SEODashboardPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [stats, setStats] = useState<SEOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/seo/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    {
      id: 'rank-tracker',
      title: 'Rank Tracker',
      description: 'Monitor keyword positions across locales',
      icon: '📊',
      color: 'green',
      href: `/${locale}/admin/seo/rank-tracker`,
      stats: stats ? `${stats.overview.keywordsRanking} ranking` : null,
    },
    {
      id: 'keywords',
      title: 'Keyword Research',
      description: 'Discover new keywords with Google Suggest',
      icon: '🔍',
      color: 'blue',
      href: `/${locale}/admin/seo/keywords`,
      stats: 'Multi-locale',
    },
    {
      id: 'backlinks',
      title: 'Backlink Monitor',
      description: 'Track and analyze your backlink profile',
      icon: '🔗',
      color: 'purple',
      href: `/${locale}/admin/seo/backlinks`,
      stats: stats ? `${stats.overview.totalBacklinks} links` : null,
    },
    {
      id: 'site-audit',
      title: 'Site Audit',
      description: 'Technical SEO analysis with Lighthouse',
      icon: '🔬',
      color: 'yellow',
      href: `/${locale}/admin/seo/site-audit`,
      stats: stats?.overview.lastAuditScore ? `Score: ${stats.overview.lastAuditScore}` : 'Run audit',
    },
    {
      id: 'competitors',
      title: 'Competitor Analysis',
      description: 'Track and compare with competitors',
      icon: '🎯',
      color: 'red',
      href: `/${locale}/admin/seo/competitors`,
      stats: 'Track rivals',
    },
    {
      id: 'tags',
      title: 'Tag Recommender',
      description: 'VidIQ-style tag suggestions with AI',
      icon: '🏷️',
      color: 'cyan',
      href: `/${locale}/admin/seo/tags`,
      stats: 'AI-powered',
    },
    {
      id: 'reports',
      title: 'SEO Reports',
      description: 'Automated weekly and monthly reports',
      icon: '📈',
      color: 'pink',
      href: `/${locale}/admin/seo/reports`,
      stats: 'Generate',
    },
    {
      id: 'google',
      title: 'Google Integration',
      description: 'Search Console & Analytics data',
      icon: '🔗',
      color: 'orange',
      href: `/${locale}/admin/seo/google`,
      stats: 'Connect',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      green: { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30', text: 'text-green-400' },
      blue: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30', text: 'text-blue-400' },
      purple: { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-500/30', text: 'text-purple-400' },
      yellow: { bg: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
      red: { bg: 'from-red-500/20 to-red-600/20', border: 'border-red-500/30', text: 'text-red-400' },
      cyan: { bg: 'from-cyan-500/20 to-cyan-600/20', border: 'border-cyan-500/30', text: 'text-cyan-400' },
      orange: { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-500/30', text: 'text-orange-400' },
      pink: { bg: 'from-pink-500/20 to-pink-600/20', border: 'border-pink-500/30', text: 'text-pink-400' },
    };
    return colors[color] || colors.green;
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
          onClick={fetchStats}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">SEO Hub</h1>
        <p className="text-gray-400 text-lg">
          Professional SEO tools with multi-locale support ({stats?.overview.activeLocales || 0} active locales)
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">Keywords Tracked</div>
          <div className="text-4xl font-bold text-white mb-1">{stats?.overview.totalKeywords || 0}</div>
          <div className="text-xs text-gray-400">{stats?.overview.keywordsRanking || 0} ranking in top 100</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">Avg Position</div>
          <div className="text-4xl font-bold text-white mb-1">
            {stats?.overview.avgPosition ? `#${stats.overview.avgPosition}` : '-'}
          </div>
          <div className="text-xs text-gray-400">Across all locales</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-sm text-purple-400 font-semibold mb-2">Backlinks</div>
          <div className="text-4xl font-bold text-white mb-1">{stats?.overview.totalBacklinks || 0}</div>
          <div className="text-xs text-gray-400">Active links</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-sm text-yellow-400 font-semibold mb-2">Site Health</div>
          <div className="text-4xl font-bold text-white mb-1">
            {stats?.overview.lastAuditScore || '-'}
          </div>
          <div className="text-xs text-gray-400">
            {stats?.overview.lastAuditDate
              ? `Last: ${new Date(stats.overview.lastAuditDate).toLocaleDateString()}`
              : 'No audit yet'}
          </div>
        </div>
      </div>

      {/* Position Distribution & Recent Changes */}
      <div className="grid grid-cols-2 gap-6">
        {/* Position Distribution */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Position Distribution</h2>
          <div className="space-y-3">
            {[
              { label: 'Top 3', value: stats?.distribution.top3 || 0, color: 'bg-green-500' },
              { label: 'Top 10', value: stats?.distribution.top10 || 0, color: 'bg-blue-500' },
              { label: 'Top 20', value: stats?.distribution.top20 || 0, color: 'bg-purple-500' },
              { label: 'Top 50', value: stats?.distribution.top50 || 0, color: 'bg-yellow-500' },
              { label: 'Top 100', value: stats?.distribution.top100 || 0, color: 'bg-orange-500' },
              { label: 'Not Ranking', value: stats?.distribution.notRanking || 0, color: 'bg-gray-500' },
            ].map((item) => {
              const total = stats?.overview.totalKeywords || 1;
              const percentage = (item.value / total) * 100;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-400">{item.label}</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-3">
                    <div
                      className={`${item.color} h-3 rounded-full transition-all`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    ></div>
                  </div>
                  <div className="w-12 text-right text-sm font-semibold text-white">{item.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Changes */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Position Changes</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{stats?.recentChanges.improved || 0}</div>
              <div className="text-sm text-gray-400">Improved ↑</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-400">{stats?.recentChanges.declined || 0}</div>
              <div className="text-sm text-gray-400">Declined ↓</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{stats?.recentChanges.new || 0}</div>
              <div className="text-sm text-gray-400">New Rankings</div>
            </div>
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-gray-400">{stats?.recentChanges.stable || 0}</div>
              <div className="text-sm text-gray-400">Stable →</div>
            </div>
          </div>
        </div>
      </div>

      {/* Locale Stats */}
      {stats?.localeStats && stats.localeStats.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Keywords by Locale</h2>
          <div className="flex flex-wrap gap-3">
            {stats.localeStats.map((locale) => (
              <div
                key={locale.code}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 rounded-lg"
              >
                <span className="text-xl">{locale.flag}</span>
                <span className="font-medium text-white">{locale.name}</span>
                <span className="text-sm text-gray-400">({locale.keywordCount})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Cards */}
      <div>
        <h2 className="text-xl font-bold mb-4">SEO Tools</h2>
        <div className="grid grid-cols-3 gap-6">
          {modules.map((module) => {
            const colors = getColorClasses(module.color);
            return (
              <Link
                key={module.id}
                href={module.href}
                className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-6 hover:scale-[1.02] transition-all group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{module.icon}</span>
                  {module.stats && (
                    <span className={`text-xs font-semibold ${colors.text} bg-black/20 px-2 py-1 rounded`}>
                      {module.stats}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition">
                  {module.title}
                </h3>
                <p className="text-sm text-gray-400">{module.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${locale}/admin/seo/rank-tracker?action=add`}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <span>+</span> Add Keywords
          </Link>
          <Link
            href={`/${locale}/admin/seo/keywords`}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <span>🔍</span> Research Keywords
          </Link>
          <button
            onClick={() => {
              fetch('/api/admin/seo/keywords/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ checkAll: true }),
              }).then(() => {
                alert('Position check started! This may take a few minutes.');
                fetchStats();
              });
            }}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
          >
            <span>🔄</span> Check Positions
          </button>
          <Link
            href={`/${locale}/admin/seo/site-audit`}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition flex items-center gap-2"
          >
            <span>🔬</span> Run Site Audit
          </Link>
        </div>
      </div>
    </div>
  );
}
