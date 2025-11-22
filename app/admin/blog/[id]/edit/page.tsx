"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { generateSlug } from "@/lib/blog-utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  author: {
    name: string;
    email: string;
  };
  categories: string[];
  tags: string[];
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    author: {
      name: "",
      email: "",
    },
    categories: "",
    tags: "",
    status: "draft" as "draft" | "published",
  });

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/admin/blog/${id}`);
      if (response.ok) {
        const post: BlogPost = await response.json();
        setFormData({
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          featuredImage: post.featuredImage || "",
          author: post.author,
          categories: post.categories.join(", "),
          tags: post.tags.join(", "),
          status: post.status,
        });
      } else {
        alert("Failed to load post");
        router.push("/admin/blog");
      }
    } catch (error) {
      alert("Failed to load post");
      router.push("/admin/blog");
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          categories: formData.categories.split(",").map((c) => c.trim()).filter(Boolean),
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
          publishedAt: formData.status === "published" ? new Date().toISOString() : undefined,
        }),
      });

      if (response.ok) {
        router.push("/admin/blog");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert("Failed to update post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/blog");
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      alert("Failed to delete post");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-gray-400">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Edit Post</h1>
        <p className="text-gray-400">Update your blog post</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
            placeholder="Enter post title..."
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
            placeholder="post-url-slug"
          />
          <p className="text-xs text-gray-500 mt-1">URL-friendly version of the title</p>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Excerpt <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
            placeholder="Brief description of the post..."
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
          />
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Featured Image URL</label>
          <input
            type="url"
            value={formData.featuredImage}
            onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Author */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Author Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.author.name}
              onChange={(e) => setFormData({ ...formData, author: { ...formData.author, name: e.target.value } })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Author Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.author.email}
              onChange={(e) => setFormData({ ...formData, author: { ...formData.author, email: e.target.value } })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
              placeholder="john@example.com"
            />
          </div>
        </div>

        {/* Categories and Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Categories</label>
            <input
              type="text"
              value={formData.categories}
              onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
              placeholder="AI, Technology, Tips (comma-separated)"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Tags</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
              placeholder="image-upscaling, ai, tutorial (comma-separated)"
            />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "published" })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            {deleting ? "Deleting..." : "Delete Post"}
          </button>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/admin/blog")}
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition"
            >
              {saving ? "Saving..." : "Update Post"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
