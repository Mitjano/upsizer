import { auth } from "@/lib/auth";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { getAllUsers, getAllUsage, getAllTransactions } from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await auth();
  const allPosts = await getAllPosts();
  const allUsers = getAllUsers();
  const allUsage = getAllUsage();
  const allTransactions = getAllTransactions();

  const publishedPosts = allPosts.filter((p) => p.status === "published");
  const draftPosts = allPosts.filter((p) => p.status === "draft");
  const recentPosts = allPosts.slice(0, 5);

  // Calculate stats
  const activeUsers = allUsers.filter(u => u.status === 'active').length;

  // Images processed this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const imagesThisMonth = allUsage.filter(u =>
    new Date(u.createdAt) >= firstDayOfMonth
  ).length;

  // Total revenue from completed transactions
  const totalRevenue = allTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Welcome back, {session?.user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-400 text-lg">
          Your command center for managing Pixelift
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-6 hover:border-green-500/50 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">📝</div>
            <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">PUBLISHED</div>
          </div>
          <div className="text-4xl font-bold mb-1 text-white">{publishedPosts.length}</div>
          <div className="text-sm text-gray-400">Published Posts</div>
          <div className="text-xs text-gray-500 mt-2">{draftPosts.length} drafts</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">📊</div>
            <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded">TOTAL</div>
          </div>
          <div className="text-4xl font-bold mb-1 text-white">{allPosts.length}</div>
          <div className="text-sm text-gray-400">Total Articles</div>
          <div className="text-xs text-gray-500 mt-2">All time</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">👥</div>
            <div className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">ACTIVE</div>
          </div>
          <div className="text-4xl font-bold mb-1 text-white">{activeUsers}</div>
          <div className="text-sm text-gray-400">Active Users</div>
          <div className="text-xs text-gray-500 mt-2">{allUsers.length} total users</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-6 hover:border-orange-500/50 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🖼️</div>
            <div className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded">MONTH</div>
          </div>
          <div className="text-4xl font-bold mb-1 text-white">{imagesThisMonth}</div>
          <div className="text-sm text-gray-400">Images Processed</div>
          <div className="text-xs text-gray-500 mt-2">{allUsage.length} all time</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-xl p-6 hover:border-yellow-500/50 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">💰</div>
            <div className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded">TOTAL</div>
          </div>
          <div className="text-4xl font-bold mb-1 text-white">${totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Revenue</div>
          <div className="text-xs text-gray-500 mt-2">{allTransactions.filter(t => t.status === 'completed').length} transactions</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>⚡</span>
          <span>Quick Actions</span>
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          <Link
            href="/admin/analytics"
            className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/40 hover:border-green-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">📈</div>
            <h3 className="text-lg font-bold mb-1">Analytics</h3>
            <p className="text-gray-400 text-sm">Traffic & performance stats</p>
          </Link>

          <Link
            href="/admin/blog/new"
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/40 hover:border-blue-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">✍️</div>
            <h3 className="text-lg font-bold mb-1">Write New Post</h3>
            <p className="text-gray-400 text-sm">Create a new blog article</p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/40 hover:border-purple-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">👥</div>
            <h3 className="text-lg font-bold mb-1">User Management</h3>
            <p className="text-gray-400 text-sm">View and manage users</p>
          </Link>

          <Link
            href="/admin/marketing"
            className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 border border-pink-500/40 hover:border-pink-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">🎯</div>
            <h3 className="text-lg font-bold mb-1">Marketing</h3>
            <p className="text-gray-400 text-sm">Manage ad campaigns</p>
          </Link>

          <Link
            href="/admin/finance"
            className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/40 hover:border-yellow-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">💰</div>
            <h3 className="text-lg font-bold mb-1">Finance</h3>
            <p className="text-gray-400 text-sm">Revenue & transactions</p>
          </Link>

          <Link
            href="/admin/seo"
            className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/40 hover:border-indigo-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">🔍</div>
            <h3 className="text-lg font-bold mb-1">SEO Tools</h3>
            <p className="text-gray-400 text-sm">Optimize rankings</p>
          </Link>

          <Link
            href="/admin/system"
            className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/40 hover:border-red-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">⚡</div>
            <h3 className="text-lg font-bold mb-1">System</h3>
            <p className="text-gray-400 text-sm">Logs & monitoring</p>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/40 hover:border-gray-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">⚙️</div>
            <h3 className="text-lg font-bold mb-1">Settings</h3>
            <p className="text-gray-400 text-sm">Configure your platform</p>
          </Link>

          <Link
            href="/admin/usage"
            className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/40 hover:border-cyan-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">📊</div>
            <h3 className="text-lg font-bold mb-1">Usage Analytics</h3>
            <p className="text-gray-400 text-sm">Track usage patterns</p>
          </Link>

          <Link
            href="/admin/notifications"
            className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 hover:border-amber-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">🔔</div>
            <h3 className="text-lg font-bold mb-1">Notifications</h3>
            <p className="text-gray-400 text-sm">View alerts & updates</p>
          </Link>

          <Link
            href="/admin/api-keys"
            className="bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/40 hover:border-teal-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">🔑</div>
            <h3 className="text-lg font-bold mb-1">API Keys</h3>
            <p className="text-gray-400 text-sm">Manage API access</p>
          </Link>

          <Link
            href="/admin/feature-flags"
            className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/40 hover:border-violet-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">🚩</div>
            <h3 className="text-lg font-bold mb-1">Feature Flags</h3>
            <p className="text-gray-400 text-sm">Control rollouts</p>
          </Link>
        </div>
      </div>

      {/* Recent Blog Posts */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>📰</span>
          <span>Recent Blog Posts</span>
        </h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          {recentPosts.length === 0 ? (
            <p className="text-gray-400 text-center py-12">
              No blog posts yet. Create your first post to get started!
            </p>
          ) : (
            <div className="divide-y divide-gray-700">
              {recentPosts.map((post) => (
                <div key={post.id} className="p-4 hover:bg-gray-700/30 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="font-semibold text-white hover:text-green-400 transition truncate"
                        >
                          {post.title}
                        </Link>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded ${
                            post.status === "published"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-1 mb-2">
                        {post.excerpt || "No excerpt"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>✍️ {post.author.name}</span>
                        <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.categories.length > 0 && (
                          <span>🏷️ {post.categories.join(", ")}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition whitespace-nowrap"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {recentPosts.length > 0 && (
          <div className="mt-4 text-center">
            <Link
              href="/admin/blog"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium transition"
            >
              View all posts →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
