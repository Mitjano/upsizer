"use client";

import { useState } from 'react';
import { Campaign } from '@/lib/db';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MarketingClientProps {
  campaigns: Campaign[];
  stats: {
    totalSpend: number;
    totalBudget: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    avgCTR: string;
    avgConversionRate: string;
    avgCPC: string;
  };
}

export default function MarketingClient({ campaigns, stats }: MarketingClientProps) {
  const [filterType, setFilterType] = useState<'all' | 'google_ads' | 'facebook_ads' | 'email'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'completed'>('all');

  const filteredCampaigns = campaigns.filter(c => {
    const matchesType = filterType === 'all' || c.type === filterType;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesType && matchesStatus;
  });

  // Prepare chart data
  const campaignChartData = filteredCampaigns.map(c => ({
    name: c.name,
    impressions: c.impressions,
    clicks: c.clicks,
    conversions: c.conversions,
    spent: c.spent,
  }));

  const typeDistribution = [
    { name: 'Google Ads', value: campaigns.filter(c => c.type === 'google_ads').length, color: '#10B981' },
    { name: 'Facebook Ads', value: campaigns.filter(c => c.type === 'facebook_ads').length, color: '#3B82F6' },
    { name: 'Email', value: campaigns.filter(c => c.type === 'email').length, color: '#8B5CF6' },
  ].filter(item => item.value > 0);

  const statusDistribution = [
    { name: 'Active', value: campaigns.filter(c => c.status === 'active').length, color: '#10B981' },
    { name: 'Paused', value: campaigns.filter(c => c.status === 'paused').length, color: '#F59E0B' },
    { name: 'Completed', value: campaigns.filter(c => c.status === 'completed').length, color: '#6B7280' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Marketing & Advertising</h1>
        <p className="text-gray-400 text-lg">Monitor and manage all your marketing campaigns</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">Total Spend</div>
          <div className="text-4xl font-bold text-white mb-1">${stats.totalSpend.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Budget: ${stats.totalBudget.toLocaleString()}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">Impressions</div>
          <div className="text-4xl font-bold text-white mb-1">{(stats.totalImpressions / 1000).toFixed(1)}K</div>
          <div className="text-xs text-gray-400">Total reach</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-sm text-purple-400 font-semibold mb-2">Clicks</div>
          <div className="text-4xl font-bold text-white mb-1">{stats.totalClicks.toLocaleString()}</div>
          <div className="text-xs text-gray-400">CTR: {stats.avgCTR}%</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-sm text-yellow-400 font-semibold mb-2">Conversions</div>
          <div className="text-4xl font-bold text-white mb-1">{stats.totalConversions}</div>
          <div className="text-xs text-gray-400">Rate: {stats.avgConversionRate}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="google_ads">Google Ads</option>
              <option value="facebook_ads">Facebook Ads</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Campaign Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="clicks" fill="#3B82F6" name="Clicks" />
              <Bar dataKey="conversions" fill="#10B981" name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Types */}
        {typeDistribution.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6">Campaign Types</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Campaigns Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">All Campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Campaign</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Type</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Budget</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Spent</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Impressions</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Clicks</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Conversions</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">ROI</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    No campaigns found
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0';
                  const roi = campaign.spent > 0 ? (((campaign.conversions * 50 - campaign.spent) / campaign.spent) * 100).toFixed(0) : '0';

                  return (
                    <tr key={campaign.id} className="border-b border-gray-800 hover:bg-gray-700/30">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{campaign.name}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(campaign.startDate).toLocaleDateString()} - {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
                          {campaign.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          campaign.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {campaign.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-gray-300">${campaign.budget.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-bold text-red-400">${campaign.spent.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">{((campaign.spent / campaign.budget) * 100).toFixed(0)}%</div>
                      </td>
                      <td className="py-4 px-6 text-right text-blue-400 font-semibold">{campaign.impressions.toLocaleString()}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="font-semibold text-purple-400">{campaign.clicks.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">CTR: {ctr}%</div>
                      </td>
                      <td className="py-4 px-6 text-right text-green-400 font-bold">{campaign.conversions}</td>
                      <td className="py-4 px-6 text-right">
                        <span className={`font-bold ${parseFloat(roi) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {roi}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Average CPC</h3>
          <div className="text-3xl font-bold text-green-400 mb-2">${stats.avgCPC}</div>
          <div className="text-sm text-gray-400">Cost per click</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Average CTR</h3>
          <div className="text-3xl font-bold text-blue-400 mb-2">{stats.avgCTR}%</div>
          <div className="text-sm text-gray-400">Click-through rate</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Conversion Rate</h3>
          <div className="text-3xl font-bold text-purple-400 mb-2">{stats.avgConversionRate}%</div>
          <div className="text-sm text-gray-400">Clicks to conversions</div>
        </div>
      </div>
    </div>
  );
}
