import { auth } from "@/lib/auth";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export default async function AdminDashboard() {
  const session = await auth();
  const allPosts = await getAllPosts();

  const publishedPosts = allPosts.filter((p) => p.status === "published");
  const draftPosts = allPosts.filter((p) => p.status === "draft");
  const recentPosts = allPosts.slice(0, 5);

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
      <div className="grid md:grid-cols-4 gap-6 mb-8">
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
          <div className="text-4xl font-bold mb-1 text-white">-</div>
          <div className="text-sm text-gray-400">Users</div>
          <div className="text-xs text-gray-500 mt-2">Coming soon</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-6 hover:border-orange-500/50 transition">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🖼️</div>
            <div className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded">MONTH</div>
          </div>
          <div className="text-4xl font-bold mb-1 text-white">-</div>
          <div className="text-sm text-gray-400">Images Processed</div>
          <div className="text-xs text-gray-500 mt-2">Coming soon</div>
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
            href="/admin/blog/new"
            className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/40 hover:border-green-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">✍️</div>
            <h3 className="text-lg font-bold mb-1">Write New Post</h3>
            <p className="text-gray-400 text-sm">Create a new blog article</p>
          </Link>

          <Link
            href="/admin/blog"
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/40 hover:border-blue-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">📚</div>
            <h3 className="text-lg font-bold mb-1">Manage Posts</h3>
            <p className="text-gray-400 text-sm">Edit or delete existing posts</p>
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
            href="/admin/settings"
            className="bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/40 hover:border-gray-500 rounded-xl p-6 transition-all group hover:scale-105"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">⚙️</div>
            <h3 className="text-lg font-bold mb-1">Settings</h3>
            <p className="text-gray-400 text-sm">Configure your platform</p>
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
