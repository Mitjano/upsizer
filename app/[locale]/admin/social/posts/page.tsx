"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface SocialAccount {
  platform: string;
  accountName: string;
  accountHandle?: string;
  avatarUrl?: string;
}

interface SocialPost {
  id: string;
  content: string;
  mediaUrls: string[];
  mediaTypes: string[];
  link?: string;
  hashtags: string[];
  mentions: string[];
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  engagementRate: number;
  account?: SocialAccount;
  createdAt: string;
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

export default function PostsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const showNew = searchParams.get("new") === "true";

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(showNew);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [accounts, setAccounts] = useState<
    Array<{ id: string; platform: string; accountName: string }>
  >([]);

  const [newPost, setNewPost] = useState({
    content: "",
    accountId: "",
    scheduledAt: "",
    link: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const url =
        statusFilter === "all"
          ? "/api/admin/social/posts"
          : `/api/admin/social/posts?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/social/accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchAccounts();
  }, [fetchPosts, fetchAccounts]);

  const createPost = async () => {
    if (!newPost.content.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPost.content,
          accountId: newPost.accountId || undefined,
          scheduledAt: newPost.scheduledAt || undefined,
          link: newPost.link || undefined,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewPost({ content: "", accountId: "", scheduledAt: "", link: "" });
        fetchPosts();
      }
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await fetch(`/api/admin/social/posts?id=${id}`, { method: "DELETE" });
      fetchPosts();
      if (selectedPost?.id === id) setSelectedPost(null);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "scheduled":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "draft":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "publishing":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const stats = {
    total: posts.length,
    draft: posts.filter((p) => p.status === "draft").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
  };

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
            <h1 className="text-3xl font-bold">Posts</h1>
          </div>
          <p className="text-gray-400">Create and manage your social posts</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl transition"
        >
          <span>+</span> New Post
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`p-4 rounded-xl border transition ${statusFilter === "all" ? "bg-gray-700 border-cyan-500" : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"}`}
        >
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-gray-400 text-sm">All Posts</div>
        </button>
        <button
          onClick={() => setStatusFilter("draft")}
          className={`p-4 rounded-xl border transition ${statusFilter === "draft" ? "bg-gray-700 border-cyan-500" : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"}`}
        >
          <div className="text-2xl font-bold text-gray-400">{stats.draft}</div>
          <div className="text-gray-400 text-sm">Drafts</div>
        </button>
        <button
          onClick={() => setStatusFilter("scheduled")}
          className={`p-4 rounded-xl border transition ${statusFilter === "scheduled" ? "bg-gray-700 border-cyan-500" : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"}`}
        >
          <div className="text-2xl font-bold text-blue-400">
            {stats.scheduled}
          </div>
          <div className="text-gray-400 text-sm">Scheduled</div>
        </button>
        <button
          onClick={() => setStatusFilter("published")}
          className={`p-4 rounded-xl border transition ${statusFilter === "published" ? "bg-gray-700 border-cyan-500" : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"}`}
        >
          <div className="text-2xl font-bold text-green-400">
            {stats.published}
          </div>
          <div className="text-gray-400 text-sm">Published</div>
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts List */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-gray-400 text-center py-12">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-12 text-center border border-gray-700/50">
              <div className="text-6xl mb-6">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No posts yet
              </h3>
              <p className="text-gray-400 mb-4">
                Create your first social media post
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-xl transition"
              >
                Create Post
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`p-4 rounded-xl cursor-pointer transition ${
                    selectedPost?.id === post.id
                      ? "bg-cyan-500/20 border border-cyan-500/50"
                      : "bg-gray-800/50 border border-gray-700/50 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {post.account && (
                      <div
                        className={`w-10 h-10 rounded-lg ${PLATFORM_COLORS[post.account.platform] || "bg-gray-600"} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                      >
                        {PLATFORM_ICONS[post.account.platform] ||
                          post.account.platform[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
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
                        <span className="text-gray-600 text-xs ml-auto">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-white text-sm line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {post.hashtags.slice(0, 5).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-cyan-400 text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.hashtags.length > 5 && (
                            <span className="text-gray-500 text-xs">
                              +{post.hashtags.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                      {post.status === "published" && (
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>{post.totalLikes} likes</span>
                          <span>{post.totalComments} comments</span>
                          <span>{post.totalShares} shares</span>
                          {post.engagementRate > 0 && (
                            <span className="text-cyan-400">
                              {post.engagementRate.toFixed(2)}% engagement
                            </span>
                          )}
                        </div>
                      )}
                      {post.scheduledAt && post.status === "scheduled" && (
                        <div className="text-xs text-blue-400 mt-1">
                          Scheduled:{" "}
                          {new Date(post.scheduledAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Details / Preview */}
        <div className="lg:col-span-1">
          {selectedPost ? (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 sticky top-4">
              <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                <h3 className="font-semibold text-white">Post Details</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deletePost(selectedPost.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(selectedPost.status)}`}
                  >
                    {selectedPost.status.toUpperCase()}
                  </span>
                </div>

                {selectedPost.account && (
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${PLATFORM_COLORS[selectedPost.account.platform] || "bg-gray-600"} flex items-center justify-center text-white font-bold`}
                    >
                      {PLATFORM_ICONS[selectedPost.account.platform] ||
                        selectedPost.account.platform[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-medium capitalize">
                        {selectedPost.account.platform}
                      </div>
                      <div className="text-gray-400 text-sm">
                        @{selectedPost.account.accountName}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-gray-400 text-xs uppercase mb-1">
                    Content
                  </h4>
                  <p className="text-white text-sm whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                </div>

                {selectedPost.link && (
                  <div>
                    <h4 className="text-gray-400 text-xs uppercase mb-1">
                      Link
                    </h4>
                    <a
                      href={selectedPost.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 text-sm hover:underline break-all"
                    >
                      {selectedPost.link}
                    </a>
                  </div>
                )}

                {selectedPost.hashtags.length > 0 && (
                  <div>
                    <h4 className="text-gray-400 text-xs uppercase mb-1">
                      Hashtags
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedPost.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPost.scheduledAt && (
                  <div>
                    <h4 className="text-gray-400 text-xs uppercase mb-1">
                      Scheduled
                    </h4>
                    <p className="text-white text-sm">
                      {new Date(selectedPost.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedPost.status === "published" && (
                  <div>
                    <h4 className="text-gray-400 text-xs uppercase mb-2">
                      Engagement
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-gray-900/50 rounded text-center">
                        <div className="text-lg font-bold text-white">
                          {selectedPost.totalLikes}
                        </div>
                        <div className="text-gray-400 text-xs">Likes</div>
                      </div>
                      <div className="p-2 bg-gray-900/50 rounded text-center">
                        <div className="text-lg font-bold text-white">
                          {selectedPost.totalComments}
                        </div>
                        <div className="text-gray-400 text-xs">Comments</div>
                      </div>
                      <div className="p-2 bg-gray-900/50 rounded text-center">
                        <div className="text-lg font-bold text-white">
                          {selectedPost.totalShares}
                        </div>
                        <div className="text-gray-400 text-xs">Shares</div>
                      </div>
                      <div className="p-2 bg-gray-900/50 rounded text-center">
                        <div className="text-lg font-bold text-white">
                          {selectedPost.totalReach}
                        </div>
                        <div className="text-gray-400 text-xs">Reach</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-8 text-center">
              <div className="text-4xl mb-4">👈</div>
              <p className="text-gray-400">Select a post to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              Create New Post
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Content *
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  placeholder="What's on your mind?"
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none"
                />
                <div className="text-gray-500 text-xs mt-1 text-right">
                  {newPost.content.length} characters
                </div>
              </div>

              {accounts.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Account (optional)
                  </label>
                  <select
                    value={newPost.accountId}
                    onChange={(e) =>
                      setNewPost({ ...newPost, accountId: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
                  >
                    <option value="">Select account...</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.platform} - @{acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Link (optional)
                </label>
                <input
                  type="url"
                  value={newPost.link}
                  onChange={(e) =>
                    setNewPost({ ...newPost, link: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Schedule (optional)
                </label>
                <input
                  type="datetime-local"
                  value={newPost.scheduledAt}
                  onChange={(e) =>
                    setNewPost({ ...newPost, scheduledAt: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPost({
                    content: "",
                    accountId: "",
                    scheduledAt: "",
                    link: "",
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={createPost}
                disabled={saving || !newPost.content.trim()}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-semibold rounded-xl transition"
              >
                {saving
                  ? "Creating..."
                  : newPost.scheduledAt
                    ? "Schedule"
                    : "Save Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
