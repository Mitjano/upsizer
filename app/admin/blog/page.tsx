import { getAllPosts } from "@/lib/blog";
import Link from "next/link";
import BlogListClient from "./BlogListClient";

export const metadata = {
  title: "Blog Posts - Admin Panel",
  description: "Manage your blog posts",
};

export default async function AdminBlogPage() {
  const posts = await getAllPosts();

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Blog Posts</h1>
          <p className="text-gray-400 text-lg">Manage all your blog posts</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-lg shadow-green-500/20"
        >
          ✍️ New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-white mb-2">No posts yet</h2>
          <p className="text-gray-400 mb-6">Create your first blog post to get started</p>
          <Link
            href="/admin/blog/new"
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Create First Post
          </Link>
        </div>
      ) : (
        <BlogListClient posts={posts} />
      )}
    </div>
  );
}
