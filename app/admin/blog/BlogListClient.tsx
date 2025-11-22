"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

interface BlogListClientProps {
  posts: BlogPost[];
}

type FilterStatus = "all" | "published" | "draft";
type SortBy = "newest" | "oldest" | "title";

export default function BlogListClient({ posts }: BlogListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt?.toLowerCase().includes(query) ||
          post.categories.some((cat) => cat.toLowerCase().includes(query)) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((post) => post.status === filterStatus);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    return filtered;
  }, [posts, searchQuery, filterStatus, sortBy]);

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Total Posts</span>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Published</span>
            <span className="text-2xl">✅</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.published}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Drafts</span>
            <span className="text-2xl">📝</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.draft}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Search Posts
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, excerpt, categories, or tags..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-500 focus:outline-none transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none transition cursor-pointer"
            >
              <option value="all">All Posts</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>

        {/* Sort */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-300">Sort by:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("newest")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                sortBy === "newest"
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Newest
            </button>
            <button
              onClick={() => setSortBy("oldest")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                sortBy === "oldest"
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Oldest
            </button>
            <button
              onClick={() => setSortBy("title")}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                sortBy === "title"
                  ? "bg-green-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Title A-Z
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
          Showing {filteredAndSortedPosts.length} of {posts.length} posts
        </div>
      </div>

      {/* Posts List */}
      {filteredAndSortedPosts.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-white mb-2">No posts found</h2>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-semibold">Title</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Categories</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Author</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Created</th>
                  <th className="text-right p-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-gray-700 hover:bg-gray-700/50 transition"
                  >
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="font-semibold text-white hover:text-green-400 transition"
                        >
                          {post.title}
                        </Link>
                        {post.excerpt && (
                          <div className="text-sm text-gray-400 line-clamp-1 mt-1">
                            {post.excerpt}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          post.status === "published"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {post.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="p-4">
                      {post.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {post.categories.slice(0, 2).map((category) => (
                            <span
                              key={category}
                              className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded"
                            >
                              {category}
                            </span>
                          ))}
                          {post.categories.length > 2 && (
                            <span className="px-2 py-0.5 text-gray-400 text-xs">
                              +{post.categories.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-300 text-sm">{post.author.name}</td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/admin/blog/${post.id}/edit`}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                        >
                          Edit
                        </Link>
                        {post.status === "published" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
