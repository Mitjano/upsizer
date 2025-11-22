"use client";

import { useState } from 'react';

export default function SEOPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'keywords' | 'pages' | 'backlinks'>('overview');

  const seoStats = {
    organicTraffic: 15420,
    keywords: 247,
    backlinks: 1854,
    domainAuthority: 42,
    pageSpeed: 87,
    mobileScore: 92,
  };

  const topKeywords = [
    { keyword: 'AI image upscaler', position: 3, volume: 8900, traffic: 3200, trend: 'up' },
    { keyword: 'upscale image online', position: 7, volume: 5400, traffic: 1800, trend: 'up' },
    { keyword: 'image enhancement AI', position: 12, volume: 4200, traffic: 950, trend: 'down' },
    { keyword: 'photo upscaler free', position: 5, volume: 6700, traffic: 2100, trend: 'stable' },
    { keyword: 'enhance image quality', position: 15, volume: 3800, traffic: 680, trend: 'up' },
  ];

  const topPages = [
    { url: '/', views: 12500, conversions: 420, bounceRate: 32 },
    { url: '/tools/upscaler', views: 9800, conversions: 680, bounceRate: 28 },
    { url: '/pricing', views: 4200, conversions: 180, bounceRate: 45 },
    { url: '/blog', views: 3600, conversions: 95, bounceRate: 52 },
    { url: '/about', views: 1800, conversions: 42, bounceRate: 58 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">SEO Tools & Analytics</h1>
        <p className="text-gray-400 text-lg">Monitor SEO performance and optimize your rankings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-4">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'keywords', label: 'Keywords', icon: '🔑' },
          { id: 'pages', label: 'Top Pages', icon: '📄' },
          { id: 'backlinks', label: 'Backlinks', icon: '🔗' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* SEO Metrics */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
              <div className="text-sm text-green-400 font-semibold mb-2">Organic Traffic</div>
              <div className="text-4xl font-bold text-white mb-1">{seoStats.organicTraffic.toLocaleString()}</div>
              <div className="text-xs text-gray-400">+15.3% this month</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
              <div className="text-sm text-blue-400 font-semibold mb-2">Ranking Keywords</div>
              <div className="text-4xl font-bold text-white mb-1">{seoStats.keywords}</div>
              <div className="text-xs text-gray-400">Top 100 positions</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
              <div className="text-sm text-purple-400 font-semibold mb-2">Backlinks</div>
              <div className="text-4xl font-bold text-white mb-1">{seoStats.backlinks.toLocaleString()}</div>
              <div className="text-xs text-gray-400">From {Math.floor(seoStats.backlinks / 5)} domains</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Domain Authority</h3>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{seoStats.domainAuthority}</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${seoStats.domainAuthority}%` }}></div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Page Speed Score</h3>
              <div className="text-4xl font-bold text-green-400 mb-2">{seoStats.pageSpeed}</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${seoStats.pageSpeed}%` }}></div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Mobile Score</h3>
              <div className="text-4xl font-bold text-blue-400 mb-2">{seoStats.mobileScore}</div>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${seoStats.mobileScore}%` }}></div>
              </div>
            </div>
          </div>

          {/* Top Keywords Table */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Top Performing Keywords</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Keyword</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-400">Position</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Search Volume</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Traffic</th>
                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-400">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {topKeywords.map((kw, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-gray-700/30">
                      <td className="py-4 px-6 font-semibold text-white">{kw.keyword}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          kw.position <= 3 ? 'bg-green-500/20 text-green-400' :
                          kw.position <= 10 ? 'bg-blue-500/20 text-blue-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          #{kw.position}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-gray-300">{kw.volume.toLocaleString()}/mo</td>
                      <td className="py-4 px-6 text-right text-green-400 font-semibold">{kw.traffic.toLocaleString()}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`${
                          kw.trend === 'up' ? 'text-green-400' :
                          kw.trend === 'down' ? 'text-red-400' :
                          'text-gray-400'
                        }`}>
                          {kw.trend === 'up' ? '↑' : kw.trend === 'down' ? '↓' : '→'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🔑</div>
          <h2 className="text-2xl font-bold text-white mb-2">Keyword Research</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Track keyword rankings, discover new opportunities, and monitor competitors.
          </p>
          <button className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition">
            Add Keywords to Track
          </button>
        </div>
      )}

      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold">Top Performing Pages</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">URL</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Page Views</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Conversions</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Bounce Rate</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((page, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-700/30">
                    <td className="py-4 px-6 font-mono text-green-400">{page.url}</td>
                    <td className="py-4 px-6 text-right font-semibold text-white">{page.views.toLocaleString()}</td>
                    <td className="py-4 px-6 text-right text-blue-400 font-semibold">{page.conversions}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={`${
                        page.bounceRate < 40 ? 'text-green-400' :
                        page.bounceRate < 55 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {page.bounceRate}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition">
                        Optimize
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Backlinks Tab */}
      {activeTab === 'backlinks' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold text-white mb-2">Backlink Analysis</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Monitor your backlink profile, identify toxic links, and discover link building opportunities.
          </p>
          <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition">
            Analyze Backlinks
          </button>
        </div>
      )}
    </div>
  );
}
