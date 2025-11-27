'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiEye, FiActivity, FiTrendingUp, FiMonitor, FiSmartphone, FiTablet, FiRefreshCw } from 'react-icons/fi';

interface DailyStats {
  date: string;
  visitors: number;
  pageViews: number;
  events: number;
}

interface AnalyticsData {
  totalVisitors: number;
  totalPageViews: number;
  totalEvents: number;
  dailyStats: DailyStats[];
  topPages: { path: string; count: number }[];
  deviceStats: { mobile: number; tablet: number; desktop: number };
  eventStats: Record<string, number>;
  averagePageViewsPerVisitor: string;
}

interface RealTimeData {
  activeVisitors: number;
  recentPageViews: number;
  recentEvents: number;
  currentPages: { path: string; count: number }[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, realTimeRes] = await Promise.all([
        fetch(`/api/analytics/stats?days=${timeRange}`),
        fetch('/api/analytics/realtime'),
      ]);

      if (!statsRes.ok || !realTimeRes.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const [stats, realTime] = await Promise.all([
        statsRes.json(),
        realTimeRes.json(),
      ]);

      setData(stats);
      setRealTimeData(realTime);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh real-time data every 30 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/analytics/realtime');
        if (res.ok) {
          const realTime = await res.json();
          setRealTimeData(realTime);
        }
      } catch (err) {
        console.error('Real-time update failed:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl">
        <div className="flex items-center justify-center h-64">
          <FiRefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-zinc-900 rounded-xl">
        <div className="text-center text-red-400">
          <p>{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const deviceTotal = data.deviceStats.mobile + data.deviceStats.tablet + data.deviceStats.desktop;
  const devicePercentage = (count: number) =>
    deviceTotal > 0 ? Math.round((count / deviceTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Time range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Analytics Overview</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-zinc-400 hover:text-white transition"
            title="Refresh"
          >
            <FiRefreshCw className="w-5 h-5" />
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="bg-zinc-800 text-white rounded-lg px-3 py-2 border border-zinc-700 focus:border-purple-500 focus:outline-none"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Real-time stats */}
      {realTimeData && (
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-400 text-sm font-medium">Real-time (last 5 minutes)</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">{realTimeData.activeVisitors}</p>
              <p className="text-sm text-zinc-400">Active visitors</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{realTimeData.recentPageViews}</p>
              <p className="text-sm text-zinc-400">Page views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{realTimeData.recentEvents}</p>
              <p className="text-sm text-zinc-400">Events</p>
            </div>
            <div>
              {realTimeData.currentPages.length > 0 ? (
                <div>
                  <p className="text-sm text-white truncate">{realTimeData.currentPages[0].path}</p>
                  <p className="text-sm text-zinc-400">Top active page</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-400">No active pages</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FiUsers className="w-6 h-6" />}
          label="Total Visitors"
          value={data.totalVisitors.toLocaleString()}
          color="purple"
        />
        <StatCard
          icon={<FiEye className="w-6 h-6" />}
          label="Page Views"
          value={data.totalPageViews.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={<FiActivity className="w-6 h-6" />}
          label="Events"
          value={data.totalEvents.toLocaleString()}
          color="green"
        />
        <StatCard
          icon={<FiTrendingUp className="w-6 h-6" />}
          label="Pages/Visitor"
          value={data.averagePageViewsPerVisitor}
          color="orange"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily visitors chart */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Daily Traffic</h3>
          <div className="h-48 flex items-end gap-1">
            {data.dailyStats.slice(-14).map((day, i) => {
              const maxViews = Math.max(...data.dailyStats.slice(-14).map(d => d.pageViews));
              const height = maxViews > 0 ? (day.pageViews / maxViews) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 bg-purple-600/50 hover:bg-purple-500 transition rounded-t group relative"
                  style={{ height: `${Math.max(height, 5)}%` }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-zinc-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {day.pageViews} views
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>{data.dailyStats.slice(-14)[0]?.date || '-'}</span>
            <span>{data.dailyStats.slice(-1)[0]?.date || '-'}</span>
          </div>
        </div>

        {/* Device breakdown */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Device Breakdown</h3>
          <div className="space-y-4">
            <DeviceBar
              icon={<FiMonitor className="w-5 h-5" />}
              label="Desktop"
              count={data.deviceStats.desktop}
              percentage={devicePercentage(data.deviceStats.desktop)}
              color="blue"
            />
            <DeviceBar
              icon={<FiSmartphone className="w-5 h-5" />}
              label="Mobile"
              count={data.deviceStats.mobile}
              percentage={devicePercentage(data.deviceStats.mobile)}
              color="green"
            />
            <DeviceBar
              icon={<FiTablet className="w-5 h-5" />}
              label="Tablet"
              count={data.deviceStats.tablet}
              percentage={devicePercentage(data.deviceStats.tablet)}
              color="purple"
            />
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top pages */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Top Pages</h3>
          <div className="space-y-3">
            {data.topPages.length > 0 ? (
              data.topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-zinc-300 truncate flex-1 mr-4">{page.path}</span>
                  <span className="text-zinc-500 text-sm">{page.count} views</span>
                </div>
              ))
            ) : (
              <p className="text-zinc-500">No page view data yet</p>
            )}
          </div>
        </div>

        {/* Event breakdown */}
        <div className="bg-zinc-900 rounded-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Event Types</h3>
          <div className="space-y-3">
            {Object.entries(data.eventStats).length > 0 ? (
              Object.entries(data.eventStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-zinc-300 capitalize">{type.replace(/_/g, ' ')}</span>
                    <span className="text-zinc-500 text-sm">{count}</span>
                  </div>
                ))
            ) : (
              <p className="text-zinc-500">No event data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'purple' | 'blue' | 'green' | 'orange';
}) {
  const colors = {
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    orange: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="bg-zinc-900 rounded-xl p-6">
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}

function DeviceBar({
  icon,
  label,
  count,
  percentage,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  percentage: number;
  color: 'blue' | 'green' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-zinc-300">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-zinc-500 text-sm">{count} ({percentage}%)</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
