"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface AccountAnalytics {
  id: string;
  platform: string;
  accountName: string;
  accountHandle?: string;
  postsCount: number;
  metadata?: {
    followers?: number;
  };
  analytics?: {
    followers: number;
    followersGrowth: number;
    following: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    reach: number;
    impressions: number;
    profileVisits: number;
    websiteClicks: number;
    engagementRate: number;
    date: string;
  };
}

interface OverallStats {
  totalAccounts: number;
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalFollowers: number;
  totalEngagement: number;
  accountsByPlatform: Record<string, number>;
}

const PLATFORM_CONFIG: Record<string, { name: string; icon: string; color: string; bgColor: string }> = {
  facebook: { name: "Facebook", icon: "f", color: "text-blue-400", bgColor: "bg-blue-600" },
  instagram: { name: "Instagram", icon: "📸", color: "text-pink-400", bgColor: "bg-gradient-to-br from-purple-600 to-pink-500" },
  twitter: { name: "X/Twitter", icon: "𝕏", color: "text-white", bgColor: "bg-black" },
  linkedin: { name: "LinkedIn", icon: "in", color: "text-blue-300", bgColor: "bg-blue-700" },
  pinterest: { name: "Pinterest", icon: "📌", color: "text-red-400", bgColor: "bg-red-600" },
  tiktok: { name: "TikTok", icon: "♪", color: "text-white", bgColor: "bg-black" },
  youtube: { name: "YouTube", icon: "▶", color: "text-red-400", bgColor: "bg-red-600" },
  threads: { name: "Threads", icon: "@", color: "text-white", bgColor: "bg-black" },
};

export default function AnalyticsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [accounts, setAccounts] = useState<AccountAnalytics[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const fetchData = useCallback(async () => {
    try {
      const [accountsRes, statsRes] = await Promise.all([
        fetch("/api/admin/social/accounts"),
        fetch("/api/admin/social/stats"),
      ]);

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalFollowers = accounts.reduce(
    (sum, a) => sum + (a.analytics?.followers || a.metadata?.followers || 0),
    0
  );

  const totalEngagement = accounts.reduce(
    (sum, a) =>
      sum +
      (a.analytics?.totalLikes || 0) +
      (a.analytics?.totalComments || 0) +
      (a.analytics?.totalShares || 0),
    0
  );

  const avgEngagementRate =
    accounts.length > 0
      ? accounts.reduce((sum, a) => sum + (a.analytics?.engagementRate || 0), 0) /
        accounts.length
      : 0;

  const totalReach = accounts.reduce((sum, a) => sum + (a.analytics?.reach || 0), 0);
  const totalImpressions = accounts.reduce((sum, a) => sum + (a.analytics?.impressions || 0), 0);
  const totalWebsiteClicks = accounts.reduce((sum, a) => sum + (a.analytics?.websiteClicks || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/${locale}/admin/social`}
              className="text-gray-400 hover:text-white transition"
            >
              Social Hub
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-3xl font-bold">Analytics</h1>
          </div>
          <p className="text-gray-400">
            Track your social media performance across all platforms
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${
                dateRange === range
                  ? "bg-cyan-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-12">Loading analytics...</div>
      ) : accounts.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-12 text-center border border-gray-700/50">
          <div className="text-6xl mb-6">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No accounts connected
          </h3>
          <p className="text-gray-400 mb-4">
            Connect your social media accounts to see analytics
          </p>
          <Link
            href={`/${locale}/admin/social/accounts`}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl transition inline-block"
          >
            Connect Account
          </Link>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
              <div className="text-sm text-blue-400 font-semibold mb-2">
                Total Followers
              </div>
              <div className="text-4xl font-bold text-white">
                {totalFollowers.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Across {accounts.length} accounts
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
              <div className="text-sm text-green-400 font-semibold mb-2">
                Total Engagement
              </div>
              <div className="text-4xl font-bold text-white">
                {totalEngagement.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Likes, comments, shares
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
              <div className="text-sm text-purple-400 font-semibold mb-2">
                Avg Engagement Rate
              </div>
              <div className="text-4xl font-bold text-white">
                {avgEngagementRate.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                All platforms average
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-6">
              <div className="text-sm text-orange-400 font-semibold mb-2">
                Total Posts
              </div>
              <div className="text-4xl font-bold text-white">
                {stats?.totalPosts || 0}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {stats?.publishedPosts || 0} published
              </div>
            </div>
          </div>

          {/* Reach & Impressions */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Total Reach</div>
              <div className="text-3xl font-bold text-white">
                {totalReach.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Total Impressions</div>
              <div className="text-3xl font-bold text-white">
                {totalImpressions.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="text-gray-400 text-sm mb-2">Website Clicks</div>
              <div className="text-3xl font-bold text-cyan-400">
                {totalWebsiteClicks.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Platform Breakdown */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700/50">
            <div className="p-6 border-b border-gray-700/50">
              <h2 className="text-xl font-semibold text-white">
                Performance by Platform
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {accounts.map((account) => {
                  const config = PLATFORM_CONFIG[account.platform] || {
                    name: account.platform,
                    icon: account.platform[0].toUpperCase(),
                    color: "text-white",
                    bgColor: "bg-gray-600",
                  };

                  const followers = account.analytics?.followers || account.metadata?.followers || 0;
                  const engagement =
                    (account.analytics?.totalLikes || 0) +
                    (account.analytics?.totalComments || 0) +
                    (account.analytics?.totalShares || 0);
                  const engagementRate = account.analytics?.engagementRate || 0;
                  const growth = account.analytics?.followersGrowth || 0;

                  return (
                    <div
                      key={account.id}
                      className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center text-white font-bold text-lg shrink-0`}
                      >
                        {config.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {account.accountName}
                          </span>
                          {account.accountHandle && (
                            <span className="text-gray-500 text-sm">
                              @{account.accountHandle}
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${config.color}`}>
                          {config.name}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">
                            {followers.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">Followers</div>
                          {growth !== 0 && (
                            <div
                              className={`text-xs ${
                                growth > 0 ? "text-green-400" : "text-red-400"
                              }`}
                            >
                              {growth > 0 ? "+" : ""}
                              {growth}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">
                            {engagement.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-400">Engagement</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">
                            {engagementRate.toFixed(2)}%
                          </div>
                          <div className="text-xs text-gray-400">Eng. Rate</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white">
                            {account.postsCount}
                          </div>
                          <div className="text-xs text-gray-400">Posts</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Engagement Breakdown */}
          <div className="grid grid-cols-2 gap-6">
            {/* Engagement Types */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Engagement Breakdown
              </h3>
              <div className="space-y-4">
                {[
                  {
                    label: "Likes",
                    value: accounts.reduce((sum, a) => sum + (a.analytics?.totalLikes || 0), 0),
                    color: "bg-red-500",
                  },
                  {
                    label: "Comments",
                    value: accounts.reduce((sum, a) => sum + (a.analytics?.totalComments || 0), 0),
                    color: "bg-blue-500",
                  },
                  {
                    label: "Shares",
                    value: accounts.reduce((sum, a) => sum + (a.analytics?.totalShares || 0), 0),
                    color: "bg-green-500",
                  },
                ].map((item) => {
                  const percentage = totalEngagement > 0
                    ? (item.value / totalEngagement) * 100
                    : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-400">{item.label}</span>
                        <span className="text-sm text-white font-medium">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full transition-all`}
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Distribution */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Followers by Platform
              </h3>
              <div className="space-y-4">
                {accounts.map((account) => {
                  const followers = account.analytics?.followers || account.metadata?.followers || 0;
                  const percentage = totalFollowers > 0
                    ? (followers / totalFollowers) * 100
                    : 0;
                  const config = PLATFORM_CONFIG[account.platform];

                  return (
                    <div key={account.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded ${config?.bgColor || "bg-gray-600"} flex items-center justify-center text-white text-xs`}
                          >
                            {config?.icon || account.platform[0]}
                          </div>
                          <span className="text-sm text-gray-400">
                            {account.accountName}
                          </span>
                        </div>
                        <span className="text-sm text-white font-medium">
                          {followers.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-cyan-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">
              Analytics Tips
            </h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>
                • A good engagement rate on Instagram is 1-3%, on Facebook 0.5-1%
              </li>
              <li>
                • Track follower growth weekly to identify successful content patterns
              </li>
              <li>
                • Website clicks from social show how well you convert followers to visitors
              </li>
              <li>
                • Compare reach to impressions - high ratio means content is being seen by new people
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
