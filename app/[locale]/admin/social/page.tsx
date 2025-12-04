"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface Stats {
  totalAccounts: number;
  totalPosts: number;
  scheduledPosts: number;
  publishedPosts: number;
  totalFollowers: number;
  totalEngagement: number;
  accountsByPlatform: Record<string, number>;
}

interface RecentPost {
  id: string;
  content: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  totalLikes: number;
  totalComments: number;
  account?: {
    platform: string;
    accountName: string;
  };
}

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "f",
  instagram: "📸",
  twitter: "𝕏",
  linkedin: "in",
  pinterest: "📌",
  tiktok: "♪",
  youtube: "▶",
  threads: "@",
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-600",
  instagram: "bg-gradient-to-br from-purple-600 to-pink-500",
  twitter: "bg-black",
  linkedin: "bg-blue-700",
  pinterest: "bg-red-600",
  tiktok: "bg-black",
  youtube: "bg-red-600",
  threads: "bg-black",
};

export default function SocialHubPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [stats, setStats] = useState<Stats>({
    totalAccounts: 0,
    totalPosts: 0,
    scheduledPosts: 0,
    publishedPosts: 0,
    totalFollowers: 0,
    totalEngagement: 0,
    accountsByPlatform: {},
  });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, postsRes] = await Promise.all([
        fetch("/api/admin/social/stats"),
        fetch("/api/admin/social/posts?limit=5"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setRecentPosts(postsData.posts || []);
      }
    } catch (error) {
      console.error("Error fetching social data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "draft":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const modules = [
    {
      name: "Posts",
      description: "Create and manage social media posts",
      icon: "📝",
      href: `/${locale}/admin/social/posts`,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      stats: `${stats.totalPosts} posts`,
    },
    {
      name: "Accounts",
      description: "Connect and manage social accounts",
      icon: "🔗",
      href: `/${locale}/admin/social/accounts`,
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      stats: `${stats.totalAccounts} connected`,
    },
    {
      name: "Planner",
      description: "Visual content calendar",
      icon: "📅",
      href: `/${locale}/admin/social/planner`,
      color: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      stats: `${stats.scheduledPosts} scheduled`,
      comingSoon: true,
    },
    {
      name: "Analytics",
      description: "Performance metrics and insights",
      icon: "📊",
      href: `/${locale}/admin/social/analytics`,
      color: "from-orange-500/20 to-amber-500/20",
      borderColor: "border-orange-500/30",
      stats: "View reports",
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Social Media Hub</h1>
        <p className="text-gray-400">
          Manage your social media presence across all platforms
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-white">
            {loading ? "-" : stats.totalAccounts}
          </div>
          <div className="text-gray-400 text-sm">Connected Accounts</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-blue-400">
            {loading ? "-" : stats.scheduledPosts}
          </div>
          <div className="text-gray-400 text-sm">Scheduled Posts</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-green-400">
            {loading ? "-" : stats.publishedPosts}
          </div>
          <div className="text-gray-400 text-sm">Published Posts</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="text-3xl font-bold text-purple-400">
            {loading ? "-" : stats.totalFollowers.toLocaleString()}
          </div>
          <div className="text-gray-400 text-sm">Total Followers</div>
        </div>
      </div>

      {/* Connected Platforms */}
      {Object.keys(stats.accountsByPlatform).length > 0 && (
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">
            Connected Platforms
          </h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.accountsByPlatform).map(
              ([platform, count]) => (
                <div
                  key={platform}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${PLATFORM_COLORS[platform] || "bg-gray-600"} flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {PLATFORM_ICONS[platform] || platform[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white font-medium capitalize">
                      {platform}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {count} account{count !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.comingSoon ? "#" : module.href}
            className={`relative block bg-gradient-to-br ${module.color} rounded-xl p-6 border ${module.borderColor} hover:scale-[1.02] transition group ${module.comingSoon ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {module.comingSoon && (
              <span className="absolute top-3 right-3 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded border border-yellow-500/30">
                Coming Soon
              </span>
            )}
            <div className="text-4xl mb-4">{module.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-1">
              {module.name}
            </h3>
            <p className="text-gray-400 text-sm mb-4">{module.description}</p>
            <div className="text-cyan-400 text-sm font-medium">
              {module.stats}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Posts */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50">
        <div className="p-6 border-b border-gray-700/50 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Recent Posts</h2>
          <Link
            href={`/${locale}/admin/social/posts`}
            className="text-cyan-400 hover:text-cyan-300 text-sm"
          >
            View all
          </Link>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : recentPosts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-400 mb-4">No posts yet</p>
              <Link
                href={`/${locale}/admin/social/posts`}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Create your first post
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-xl"
                >
                  {post.account && (
                    <div
                      className={`w-10 h-10 rounded-lg ${PLATFORM_COLORS[post.account.platform] || "bg-gray-600"} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                    >
                      {PLATFORM_ICONS[post.account.platform] ||
                        post.account.platform[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(post.status)}`}
                      >
                        {post.status}
                      </span>
                      {post.account && (
                        <span className="text-gray-500 text-xs">
                          @{post.account.accountName}
                        </span>
                      )}
                    </div>
                    <p className="text-white text-sm line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {post.scheduledAt && (
                        <span>
                          Scheduled:{" "}
                          {new Date(post.scheduledAt).toLocaleDateString()}
                        </span>
                      )}
                      {post.publishedAt && (
                        <span>
                          Published:{" "}
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                      {post.status === "published" && (
                        <>
                          <span>{post.totalLikes} likes</span>
                          <span>{post.totalComments} comments</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/${locale}/admin/social/posts?new=true`}
          className="flex items-center gap-4 p-4 bg-cyan-600 hover:bg-cyan-700 rounded-xl transition"
        >
          <div className="text-3xl">✍️</div>
          <div>
            <h3 className="font-semibold text-white">Create New Post</h3>
            <p className="text-cyan-100 text-sm">
              Draft a new social media post
            </p>
          </div>
        </Link>
        <Link
          href={`/${locale}/admin/social/accounts`}
          className="flex items-center gap-4 p-4 bg-purple-600 hover:bg-purple-700 rounded-xl transition"
        >
          <div className="text-3xl">🔗</div>
          <div>
            <h3 className="font-semibold text-white">Connect Account</h3>
            <p className="text-purple-100 text-sm">Link a new social profile</p>
          </div>
        </Link>
        <Link
          href={`/${locale}/admin/seo`}
          className="flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition"
        >
          <div className="text-3xl">🔍</div>
          <div>
            <h3 className="font-semibold text-white">SEO Hub</h3>
            <p className="text-gray-300 text-sm">Optimize for search engines</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
