'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface FinanceData {
  period: string;
  credits: {
    totalInSystem: number;
    totalUsed: number;
    currentPeriodUsed: number;
    previousPeriodUsed: number;
    growthPercent: string;
  };
  revenue: {
    total: number;
    currentPeriod: number;
    previousPeriod: number;
    growthPercent: string;
    currency: string;
  };
  apiCosts: {
    totalUsd: number;
    totalPln: number;
    currentPeriodUsd: number;
    currentPeriodPln: number;
    byToolType: Array<{
      type: string;
      count: number;
      totalCost: string;
      costPerRun: string;
    }>;
    rates: Record<string, number>;
  };
  profit: {
    gross: number;
    currentPeriod: number;
    margin: string;
    currency: string;
  };
  forecast: {
    dailyAvgCreditsUsed: number;
    dailyAvgApiCostUsd: number;
    next30DaysCredits: number;
    next30DaysApiCostUsd: number;
    next30DaysApiCostPln: number;
    daysUntilCreditsDeplete: number | null;
  };
  users: {
    total: number;
    active: number;
    withCredits: number;
    free: number;
    paid: number;
  };
  usage: {
    total: number;
    currentPeriod: number;
    byType: Record<string, number>;
  };
  trends: Array<{
    date: string;
    creditsUsed: number;
    apiCost: number;
    apiCostPln: number;
    revenue: number;
    profit: number;
    operations: number;
  }>;
  recentTransactions: Array<{
    id: string;
    userId: string;
    type: string;
    plan?: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    userEmail: string;
    userName: string;
  }>;
  topUsers: Array<{
    userId: string;
    email: string;
    name: string;
    currentCredits: number;
    credits: number;
    operations: number;
    apiCost: number;
  }>;
}

const TOOL_COLORS: Record<string, string> = {
  upscale: '#10b981',
  enhance: '#3b82f6',
  restore: '#8b5cf6',
  background: '#f59e0b',
  background_remove: '#f59e0b',
  packshot: '#ec4899',
  expand: '#06b6d4',
  compress: '#6b7280',
};

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

export default function FinanceClient() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/finance?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch finance data');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400">{error || 'Failed to load data'}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const usageByTypePieData = Object.entries(data.usage.byType).map(([name, value], index) => ({
    name,
    value,
    color: TOOL_COLORS[name] || CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div>
      {/* Header with Period Selector */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Finance Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Track credits, API costs, and revenue metrics</p>
        </div>
        <div className="flex gap-2 bg-gray-800 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                period === p
                  ? 'bg-green-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p === 'week' ? '7 days' : p === 'month' ? '30 days' : '1 year'}
            </button>
          ))}
        </div>
      </div>

      {/* Critical Alert - Credits Depletion */}
      {data.forecast.daysUntilCreditsDeplete !== null && data.forecast.daysUntilCreditsDeplete < 30 && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center gap-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <p className="font-bold text-red-400">
              Credit Depletion Warning
            </p>
            <p className="text-gray-300">
              At current usage rate, system credits will deplete in{' '}
              <span className="font-bold text-red-400">{data.forecast.daysUntilCreditsDeplete} days</span>.
              Consider promoting credit purchases or adjusting pricing.
            </p>
          </div>
        </div>
      )}

      {/* Main Metrics Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {/* Credits in System */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-400 text-sm font-medium">Credits in System</span>
            <span className="text-2xl">💎</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {data.credits.totalInSystem.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {data.users.withCredits} users have credits
          </div>
        </div>

        {/* Credits Used */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 text-sm font-medium">Credits Used (Period)</span>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {data.credits.currentPeriodUsed.toLocaleString()}
          </div>
          <div className={`text-sm mt-1 ${parseFloat(data.credits.growthPercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {parseFloat(data.credits.growthPercent) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(data.credits.growthPercent))}% vs previous
          </div>
        </div>

        {/* API Costs */}
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-orange-400 text-sm font-medium">Replicate API Cost</span>
            <span className="text-2xl">🔥</span>
          </div>
          <div className="text-3xl font-bold text-white">
            ${data.apiCosts.currentPeriodUsd.toFixed(2)}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            ~{data.apiCosts.currentPeriodPln.toFixed(2)} PLN
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-400 text-sm font-medium">Revenue (Period)</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {data.revenue.currentPeriod.toLocaleString()} PLN
          </div>
          <div className={`text-sm mt-1 ${parseFloat(data.revenue.growthPercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {parseFloat(data.revenue.growthPercent) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(data.revenue.growthPercent))}% growth
          </div>
        </div>
      </div>

      {/* Forecast Section */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🔮</span> 30-Day Forecast & API Budget Planning
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Daily Avg Credits Used</p>
            <p className="text-2xl font-bold text-white">{data.forecast.dailyAvgCreditsUsed.toFixed(1)}</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Daily Avg API Cost</p>
            <p className="text-2xl font-bold text-white">${data.forecast.dailyAvgApiCostUsd.toFixed(4)}</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Next 30 Days API Cost</p>
            <p className="text-2xl font-bold text-orange-400">${data.forecast.next30DaysApiCostUsd.toFixed(2)}</p>
            <p className="text-xs text-gray-500">~{data.forecast.next30DaysApiCostPln.toFixed(2)} PLN</p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Est. Credits Needed (30d)</p>
            <p className="text-2xl font-bold text-blue-400">{data.forecast.next30DaysCredits.toLocaleString()}</p>
          </div>
        </div>

        {/* Replicate Budget Calculator */}
        <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <h3 className="font-bold text-orange-400 mb-2">💡 Replicate API Budget Recommendation</h3>
          <p className="text-gray-300 text-sm">
            Based on current usage patterns, you should budget approximately{' '}
            <span className="font-bold text-white">${(data.forecast.next30DaysApiCostUsd * 1.2).toFixed(2)}/month</span>{' '}
            (includes 20% buffer) for Replicate API costs. Current models used:
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(data.apiCosts.rates).map(([model, cost]) => (
              <span key={model} className="px-2 py-1 bg-gray-800 rounded text-xs">
                {model}: ${cost}/run
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Credits & API Cost Trend */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Credits & API Cost Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickFormatter={(v) => v.slice(5)} />
              <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="creditsUsed"
                stroke="#3b82f6"
                name="Credits Used"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="apiCost"
                stroke="#f59e0b"
                name="API Cost ($)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Usage by Tool Type */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Usage by Tool Type</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={usageByTypePieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              >
                {usageByTypePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* API Cost by Tool */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">API Cost Breakdown by Tool</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-3">Tool Type</th>
                <th className="pb-3 text-right">Operations</th>
                <th className="pb-3 text-right">Cost per Run</th>
                <th className="pb-3 text-right">Total Cost (USD)</th>
                <th className="pb-3 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {data.apiCosts.byToolType.map((tool) => {
                const totalCost = data.apiCosts.byToolType.reduce((sum, t) => sum + parseFloat(t.totalCost), 0);
                const percent = totalCost > 0 ? (parseFloat(tool.totalCost) / totalCost * 100).toFixed(1) : '0';
                return (
                  <tr key={tool.type} className="border-b border-gray-700/50">
                    <td className="py-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: TOOL_COLORS[tool.type] || '#6b7280' }}
                      />
                      {tool.type}
                    </td>
                    <td className="py-3 text-right">{tool.count.toLocaleString()}</td>
                    <td className="py-3 text-right text-gray-400">${tool.costPerRun}</td>
                    <td className="py-3 text-right font-medium">${tool.totalCost}</td>
                    <td className="py-3 text-right">
                      <span className="text-gray-400">{percent}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="pt-3">Total</td>
                <td className="pt-3 text-right">{data.usage.total.toLocaleString()}</td>
                <td className="pt-3 text-right">-</td>
                <td className="pt-3 text-right text-orange-400">${data.apiCosts.totalUsd.toFixed(4)}</td>
                <td className="pt-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Top Users by Usage */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Top Users by Credit Usage</h2>
          <div className="space-y-3">
            {data.topUsers.slice(0, 5).map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-white">{user.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-400">{user.credits} credits</p>
                  <p className="text-xs text-gray-400">{user.operations} ops | ${user.apiCost.toFixed(4)} API</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          {data.recentTransactions.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div>
                    <p className="font-medium text-white">{tx.userName}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString()} - {tx.type}
                      {tx.plan && ` (${tx.plan})`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${tx.status === 'completed' ? 'text-green-400' : tx.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {tx.amount} {tx.currency}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Distribution */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">User Statistics</h2>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <p className="text-3xl font-bold text-white">{data.users.total}</p>
            <p className="text-gray-400 text-sm">Total Users</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <p className="text-3xl font-bold text-green-400">{data.users.active}</p>
            <p className="text-gray-400 text-sm">Active Users</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <p className="text-3xl font-bold text-blue-400">{data.users.withCredits}</p>
            <p className="text-gray-400 text-sm">With Credits</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <p className="text-3xl font-bold text-gray-400">{data.users.free}</p>
            <p className="text-gray-400 text-sm">Free Tier</p>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <p className="text-3xl font-bold text-purple-400">{data.users.paid}</p>
            <p className="text-gray-400 text-sm">Paid Users</p>
          </div>
        </div>
      </div>
    </div>
  );
}
