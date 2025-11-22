import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsers, getUserStats } from "@/lib/db";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  const users = getAllUsers();
  const stats = getUserStats();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">User Management</h1>
        <p className="text-gray-400">View and manage all users on the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-6">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold mb-1 text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Users</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-6">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-3xl font-bold mb-1 text-white">{stats.active}</div>
          <div className="text-sm text-gray-400">Active Users</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-6">
          <div className="text-3xl mb-2">👑</div>
          <div className="text-3xl font-bold mb-1 text-white">{stats.admins}</div>
          <div className="text-sm text-gray-400">Admin Users</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-6">
          <div className="text-3xl mb-2">📅</div>
          <div className="text-3xl font-bold mb-1 text-white">{stats.newThisMonth}</div>
          <div className="text-sm text-gray-400">New This Month</div>
        </div>
      </div>

      {/* Users Table */}
      <UsersClient users={users} />
    </div>
  );
}
