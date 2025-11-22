import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {session?.user?.name?.split(" ")[0]}!
        </h1>
        <p className="text-gray-400">
          Manage your Pixelift platform from here
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">📝</div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
          <div className="text-3xl font-bold mb-1">0</div>
          <div className="text-sm text-gray-400">Blog Posts</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">👥</div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
          <div className="text-3xl font-bold mb-1">0</div>
          <div className="text-sm text-gray-400">Users</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🖼️</div>
            <div className="text-sm text-gray-400">This Month</div>
          </div>
          <div className="text-3xl font-bold mb-1">0</div>
          <div className="text-sm text-gray-400">Images Processed</div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">💰</div>
            <div className="text-sm text-gray-400">This Month</div>
          </div>
          <div className="text-3xl font-bold mb-1">$0</div>
          <div className="text-sm text-gray-400">Revenue</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/admin/blog/new"
            className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 hover:border-green-500 rounded-xl p-6 transition group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">✍️</div>
            <h3 className="text-xl font-bold mb-2">Write New Post</h3>
            <p className="text-gray-400 text-sm">Create a new blog article</p>
          </Link>

          <Link
            href="/admin/blog"
            className="bg-gray-800/50 border border-gray-700 hover:border-blue-500 rounded-xl p-6 transition group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">📚</div>
            <h3 className="text-xl font-bold mb-2">Manage Posts</h3>
            <p className="text-gray-400 text-sm">Edit or delete existing posts</p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-gray-800/50 border border-gray-700 hover:border-purple-500 rounded-xl p-6 transition group"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition">👥</div>
            <h3 className="text-xl font-bold mb-2">User Management</h3>
            <p className="text-gray-400 text-sm">View and manage users</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 text-center py-8">
            No recent activity to display
          </p>
        </div>
      </div>
    </div>
  );
}
