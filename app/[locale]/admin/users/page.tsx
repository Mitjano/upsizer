import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsers, getUserStats, UserMetrics } from "@/lib/db";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  const users = await getAllUsers();
  const stats = await getUserStats();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">User Management</h1>
        <p className="text-gray-400">View and manage all users on the platform</p>
      </div>

      {/* User Activity Metrics - DAU/WAU/MAU */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-300 mb-3">User Activity</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👥</span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Total</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Registered Users</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📊</span>
              <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">{stats.dauPercent}%</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.dau}</div>
            <div className="text-sm text-gray-400">DAU <span className="text-gray-500">(24h)</span></div>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📈</span>
              <span className="text-xs text-cyan-400 bg-cyan-900/30 px-2 py-0.5 rounded">{stats.wauPercent}%</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.wau}</div>
            <div className="text-sm text-gray-400">WAU <span className="text-gray-500">(7 days)</span></div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🗓️</span>
              <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">{stats.mauPercent}%</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats.mau}</div>
            <div className="text-sm text-gray-400">MAU <span className="text-gray-500">(30 days)</span></div>
          </div>
        </div>
      </div>

      {/* Growth & Conversion */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-300 mb-3">Growth & Conversion</h2>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">New Today</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.newToday}</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">New This Week</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.newThisWeek}</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">New This Month</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.newThisMonth}</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Premium Users</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.premium}</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Conversion Rate</div>
            <div className="text-2xl font-bold text-orange-400">{stats.conversionRate}%</div>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-300 mb-3">Engagement</h2>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Total Credits</div>
            <div className="text-2xl font-bold text-green-400">{stats.totalCredits.toLocaleString()}</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Total Generations</div>
            <div className="text-2xl font-bold text-blue-400">{stats.totalUsage.toLocaleString()}</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Avg Credits/User</div>
            <div className="text-2xl font-bold text-green-400">{stats.avgCreditsPerUser.toLocaleString()}</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Avg Usage/User</div>
            <div className="text-2xl font-bold text-blue-400">{stats.avgUsagePerUser}</div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="text-sm text-gray-400 mb-1">Power Users</div>
            <div className="text-2xl font-bold text-pink-400">{stats.powerUsers}</div>
            <div className="text-xs text-gray-500">&gt;10 generations</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <UsersClient users={users} stats={stats} />
    </div>
  );
}
