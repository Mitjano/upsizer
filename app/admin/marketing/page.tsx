"use client";

import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'google-ads' | 'facebook' | 'email'>('overview');

  // Mock data - replace with real API calls
  const campaignData = [
    { name: 'Google Ads', impressions: 45000, clicks: 3200, conversions: 280, spend: 1240 },
    { name: 'Facebook Ads', impressions: 38000, clicks: 2800, conversions: 210, spend: 980 },
    { name: 'Email Campaign', impressions: 12000, clicks: 1500, conversions: 150, spend: 120 },
  ];

  const weeklyData = [
    { day: 'Mon', impressions: 8500, clicks: 650, conversions: 45 },
    { day: 'Tue', impressions: 9200, clicks: 720, conversions: 52 },
    { day: 'Wed', impressions: 8800, clicks: 680, conversions: 48 },
    { day: 'Thu', impressions: 10500, clicks: 890, conversions: 67 },
    { day: 'Fri', impressions: 12000, clicks: 950, conversions: 78 },
    { day: 'Sat', impressions: 7500, clicks: 520, conversions: 38 },
    { day: 'Sun', impressions: 6800, clicks: 480, conversions: 32 },
  ];

  const totalStats = {
    totalSpend: campaignData.reduce((acc, c) => acc + c.spend, 0),
    totalImpressions: campaignData.reduce((acc, c) => acc + c.impressions, 0),
    totalClicks: campaignData.reduce((acc, c) => acc + c.clicks, 0),
    totalConversions: campaignData.reduce((acc, c) => acc + c.conversions, 0),
  };

  const avgCPC = (totalStats.totalSpend / totalStats.totalClicks).toFixed(2);
  const avgCTR = ((totalStats.totalClicks / totalStats.totalImpressions) * 100).toFixed(2);
  const conversionRate = ((totalStats.totalConversions / totalStats.totalClicks) * 100).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Marketing & Advertising</h1>
        <p className="text-gray-400 text-lg">Monitor and manage all your marketing campaigns</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700 pb-4">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'google-ads', label: 'Google Ads', icon: '🔍' },
          { id: 'facebook', label: 'Facebook Ads', icon: '👥' },
          { id: 'email', label: 'Email Marketing', icon: '✉️' },
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
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
              <div className="text-sm text-green-400 font-semibold mb-2">Total Spend</div>
              <div className="text-4xl font-bold text-white mb-1">${totalStats.totalSpend.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Last 30 days</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
              <div className="text-sm text-blue-400 font-semibold mb-2">Impressions</div>
              <div className="text-4xl font-bold text-white mb-1">{(totalStats.totalImpressions / 1000).toFixed(1)}K</div>
              <div className="text-xs text-gray-400">Total reach</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
              <div className="text-sm text-purple-400 font-semibold mb-2">Clicks</div>
              <div className="text-4xl font-bold text-white mb-1">{totalStats.totalClicks.toLocaleString()}</div>
              <div className="text-xs text-gray-400">CTR: {avgCTR}%</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
              <div className="text-sm text-yellow-400 font-semibold mb-2">Conversions</div>
              <div className="text-4xl font-bold text-white mb-1">{totalStats.totalConversions}</div>
              <div className="text-xs text-gray-400">Rate: {conversionRate}%</div>
            </div>
          </div>

          {/* Weekly Performance */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Weekly Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="impressions" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="conversions" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Campaign Comparison */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Campaign Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={campaignData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="impressions" fill="#10B981" name="Impressions" />
                <Bar dataKey="clicks" fill="#3B82F6" name="Clicks" />
                <Bar dataKey="conversions" fill="#8B5CF6" name="Conversions" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Campaigns Table */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold">Active Campaigns</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Campaign</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Impressions</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Clicks</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">CTR</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Conversions</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Spend</th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignData.map((campaign, index) => {
                    const ctr = ((campaign.clicks / campaign.impressions) * 100).toFixed(2);
                    const cpc = (campaign.spend / campaign.clicks).toFixed(2);
                    return (
                      <tr key={index} className="border-b border-gray-800 hover:bg-gray-700/30">
                        <td className="py-4 px-6 font-semibold text-white">{campaign.name}</td>
                        <td className="py-4 px-6 text-right text-gray-300">{campaign.impressions.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right text-blue-400 font-semibold">{campaign.clicks.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right text-green-400">{ctr}%</td>
                        <td className="py-4 px-6 text-right text-purple-400 font-semibold">{campaign.conversions}</td>
                        <td className="py-4 px-6 text-right text-yellow-400 font-semibold">${campaign.spend}</td>
                        <td className="py-4 px-6 text-right text-gray-400">${cpc}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Google Ads Tab */}
      {activeTab === 'google-ads' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Google Ads Integration</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Connect your Google Ads account to track campaigns, manage budgets, and optimize performance.
          </p>
          <button className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition">
            Connect Google Ads
          </button>
        </div>
      )}

      {/* Facebook Ads Tab */}
      {activeTab === 'facebook' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-2xl font-bold text-white mb-2">Facebook Ads Integration</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Connect your Meta Business account to manage Facebook and Instagram ad campaigns.
          </p>
          <button className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition">
            Connect Meta Ads
          </button>
        </div>
      )}

      {/* Email Marketing Tab */}
      {activeTab === 'email' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">✉️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Email Marketing</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Send newsletters, track opens, and manage your email campaigns.
          </p>
          <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition">
            Create Campaign
          </button>
        </div>
      )}
    </div>
  );
}
