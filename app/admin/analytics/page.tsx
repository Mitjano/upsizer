"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsData {
  totalVisitors: number;
  totalPageViews: number;
  totalEvents: number;
  averagePageViewsPerVisitor: string;
  dailyStats: Array<{
    date: string;
    visitors: number;
    pageViews: number;
    events: number;
  }>;
  topPages: Array<{ path: string; count: number }>;
  deviceStats: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  eventStats: Record<string, number>;
}

interface RealTimeData {
  activeVisitors: number;
  recentPageViews: number;
  recentEvents: number;
  currentPages: Array<{ path: string; count: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [realtime, setRealtime] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  const fetchData = async () => {
    try {
      const [statsRes, realtimeRes] = await Promise.all([
        fetch(`/api/admin/analytics?days=${timeRange}`),
        fetch('/api/admin/analytics?type=realtime'),
      ]);

      if (statsRes.ok && realtimeRes.ok) {
        const stats = await statsRes.json();
        const rt = await realtimeRes.json();
        setData(stats);
        setRealtime(rt);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Failed to load analytics data</p>
      </div>
    );
  }

  const deviceData = [
    { name: 'Desktop', value: data.deviceStats.desktop, color: '#10B981' },
    { name: 'Mobile', value: data.deviceStats.mobile, color: '#3B82F6' },
    { name: 'Tablet', value: data.deviceStats.tablet, color: '#8B5CF6' },
  ];

  const eventData = Object.entries(data.eventStats).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400 text-lg">Monitor your website performance and user behavior</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === days
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Real-Time Activity
          </h2>
          <span className="text-sm text-gray-400">Last 5 minutes</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400">{realtime?.activeVisitors || 0}</div>
            <div className="text-sm text-gray-400 mt-1">Active Visitors</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-400">{realtime?.recentPageViews || 0}</div>
            <div className="text-sm text-gray-400 mt-1">Page Views</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-3xl font-bold text-purple-400">{realtime?.recentEvents || 0}</div>
            <div className="text-sm text-gray-400 mt-1">Events</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Top Pages Now:</div>
            {realtime?.currentPages.slice(0, 2).map((page, i) => (
              <div key={i} className="text-xs text-green-400 truncate">
                {page.path} ({page.count})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-sm text-green-400 font-semibold mb-2">Total Visitors</div>
          <div className="text-4xl font-bold text-white mb-1">{data.totalVisitors.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Last {timeRange} days</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-sm text-blue-400 font-semibold mb-2">Page Views</div>
          <div className="text-4xl font-bold text-white mb-1">{data.totalPageViews.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Last {timeRange} days</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-sm text-purple-400 font-semibold mb-2">Total Events</div>
          <div className="text-4xl font-bold text-white mb-1">{data.totalEvents.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Last {timeRange} days</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-sm text-yellow-400 font-semibold mb-2">Avg. Pages/Visit</div>
          <div className="text-4xl font-bold text-white mb-1">{data.averagePageViewsPerVisitor}</div>
          <div className="text-xs text-gray-400">Engagement metric</div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Traffic Overview</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data.dailyStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Legend />
            <Line type="monotone" dataKey="visitors" stroke="#10B981" strokeWidth={2} name="Visitors" />
            <Line type="monotone" dataKey="pageViews" stroke="#3B82F6" strokeWidth={2} name="Page Views" />
            <Line type="monotone" dataKey="events" stroke="#8B5CF6" strokeWidth={2} name="Events" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Top Pages</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topPages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="path" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Bar dataKey="count" fill="#10B981" name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Device Distribution */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Device Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Event Types */}
      {eventData.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">Event Types</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eventData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#8B5CF6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Pages Table */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Detailed Page Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Rank</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Page</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Views</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {data.topPages.map((page, index) => (
                <tr key={index} className="border-b border-gray-800 hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-gray-400">#{index + 1}</td>
                  <td className="py-3 px-4 font-mono text-sm text-green-400">{page.path}</td>
                  <td className="py-3 px-4 text-right font-semibold">{page.count.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-gray-400">
                    {((page.count / data.totalPageViews) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
