import { getAllPosts } from "@/lib/blog";
import Link from "next/link";

export const metadata = {
  title: "Blog Posts - Admin Panel",
  description: "Manage your blog posts",
};

export default async function AdminBlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Blog Posts</h1>
          <p className="text-gray-400">Manage all your blog posts</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          + New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
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
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-300 font-semibold">Title</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Status</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Author</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Created</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Updated</th>
                  <th className="text-right p-4 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition">
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-white mb-1">{post.title}</div>
                        <div className="text-sm text-gray-400">{post.excerpt}</div>
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
                    <td className="p-4 text-gray-300">{post.author.name}</td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(post.updatedAt).toLocaleDateString()}
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

      <div className="mt-6 text-sm text-gray-400">
        Total posts: {posts.length} ({posts.filter((p) => p.status === "published").length} published,{" "}
        {posts.filter((p) => p.status === "draft").length} drafts)
      </div>
    </div>
  );
}
