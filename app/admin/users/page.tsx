import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

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
          <div className="text-3xl font-bold mb-1 text-white">-</div>
          <div className="text-sm text-gray-400">Total Users</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-6">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-3xl font-bold mb-1 text-white">-</div>
          <div className="text-sm text-gray-400">Active Users</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-6">
          <div className="text-3xl mb-2">👑</div>
          <div className="text-3xl font-bold mb-1 text-white">2</div>
          <div className="text-sm text-gray-400">Admin Users</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-6">
          <div className="text-3xl mb-2">📅</div>
          <div className="text-3xl font-bold mb-1 text-white">-</div>
          <div className="text-sm text-gray-400">New This Month</div>
        </div>
      </div>

      {/* Admin List */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>👑</span>
          <span>Admin Users</span>
        </h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-700">
            <div className="p-4 hover:bg-gray-700/30 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
                    A
                  </div>
                  <div>
                    <div className="font-semibold text-white">admin@pixelift.pl</div>
                    <div className="text-sm text-gray-400">Admin</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                    ADMIN
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 hover:bg-gray-700/30 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold">
                    M
                  </div>
                  <div>
                    <div className="font-semibold text-white">michalchmielarz00@gmail.com</div>
                    <div className="text-sm text-gray-400">Admin</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                    ADMIN
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regular Users */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>👥</span>
          <span>Regular Users</span>
        </h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl">
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              User Management Coming Soon
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              User registration and management features will be available in a future update.
              Currently, only admin users can access the platform.
            </p>
          </div>
        </div>
      </div>

      {/* Future Features Notice */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>🚀</span>
          <span>Planned Features</span>
        </h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>View all registered users</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>User activity tracking</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Usage statistics per user</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Ban/suspend users</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Promote users to admin</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
