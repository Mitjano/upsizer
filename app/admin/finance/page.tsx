"use client";

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinancePage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Mock data
  const revenueData = [
    { date: '2025-01', revenue: 4200, costs: 1800, profit: 2400, customers: 45 },
    { date: '2025-02', revenue: 5800, costs: 2100, profit: 3700, customers: 62 },
    { date: '2025-03', revenue: 6400, costs: 2300, profit: 4100, customers: 71 },
    { date: '2025-04', revenue: 7200, costs: 2500, profit: 4700, customers: 83 },
    { date: '2025-05', revenue: 8900, costs: 2800, profit: 6100, customers: 97 },
    { date: '2025-06', revenue: 10200, costs: 3200, profit: 7000, customers: 108 },
  ];

  const planDistribution = [
    { plan: 'Free', users: 850, revenue: 0 },
    { plan: 'Basic', users: 120, revenue: 1200 },
    { plan: 'Pro', users: 45, revenue: 2250 },
    { plan: 'Enterprise', users: 8, revenue: 6400 },
  ];

  const totalRevenue = revenueData.reduce((acc, d) => acc + d.revenue, 0);
  const totalCosts = revenueData.reduce((acc, d) => acc + d.costs, 0);
  const totalProfit = totalRevenue - totalCosts;
  const avgRevenue = (totalRevenue / revenueData.length).toFixed(0);

  const mrr = planDistribution.reduce((acc, p) => acc + p.revenue, 0);
  const arr = mrr * 12;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Finance Dashboard</h1>
          <p className="text-gray-400 text-lg">Track revenue, expenses, and financial metrics</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                timeRange === range
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">Total Revenue</div>
          <div className="text-4xl font-bold text-white mb-1">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-400">+12.3% from last period</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">MRR</div>
          <div className="text-4xl font-bold text-white mb-1">${mrr.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Monthly Recurring Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-sm text-purple-400 font-semibold mb-2">ARR</div>
          <div className="text-4xl font-bold text-white mb-1">${arr.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Annual Recurring Revenue</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-sm text-yellow-400 font-semibold mb-2">Profit</div>
          <div className="text-4xl font-bold text-white mb-1">${totalProfit.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Margin: {((totalProfit / totalRevenue) * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Revenue & Profit Trend</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Revenue" />
            <Line type="monotone" dataKey="costs" stroke="#EF4444" strokeWidth={2} name="Costs" />
            <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={3} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Plan Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={planDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="plan" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="users" fill="#3B82F6" name="Users" />
              <Bar dataKey="revenue" fill="#10B981" name="Revenue ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Customer Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="customers" stroke="#8B5CF6" strokeWidth={3} name="Customers" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Recent Transactions</h2>
          <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition">
            Export Data
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Date</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Customer</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-400">Plan</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Amount</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { date: '2025-01-22', customer: 'john@example.com', plan: 'Pro', amount: 49, status: 'completed' },
                { date: '2025-01-22', customer: 'sarah@example.com', plan: 'Enterprise', amount: 299, status: 'completed' },
                { date: '2025-01-21', customer: 'mike@example.com', plan: 'Basic', amount: 9, status: 'completed' },
                { date: '2025-01-21', customer: 'anna@example.com', plan: 'Pro', amount: 49, status: 'pending' },
                { date: '2025-01-20', customer: 'david@example.com', plan: 'Enterprise', amount: 299, status: 'completed' },
              ].map((transaction, index) => (
                <tr key={index} className="border-b border-gray-800 hover:bg-gray-700/30">
                  <td className="py-4 px-6 text-gray-300 font-mono text-sm">{transaction.date}</td>
                  <td className="py-4 px-6 text-white">{transaction.customer}</td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                      {transaction.plan}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-green-400 font-bold">${transaction.amount}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      transaction.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Stats Grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Average Revenue Per User</h3>
          <div className="text-3xl font-bold text-green-400 mb-2">
            ${(mrr / planDistribution.reduce((acc, p) => acc + p.users, 0)).toFixed(2)}
          </div>
          <div className="text-sm text-gray-400">Per month</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Customer Lifetime Value</h3>
          <div className="text-3xl font-bold text-blue-400 mb-2">$847</div>
          <div className="text-sm text-gray-400">Estimated LTV</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Churn Rate</h3>
          <div className="text-3xl font-bold text-yellow-400 mb-2">2.4%</div>
          <div className="text-sm text-gray-400">Monthly churn</div>
        </div>
      </div>
    </div>
  );
}
