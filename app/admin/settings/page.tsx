import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400">Configure your Pixelift platform</p>
      </div>

      {/* General Settings */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>⚙️</span>
          <span>General Settings</span>
        </h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Site Name
              </label>
              <input
                type="text"
                defaultValue="Pixelift"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none transition"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Site Description
              </label>
              <textarea
                defaultValue="AI-powered image enhancement platform"
                rows={3}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none transition"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Support Email
              </label>
              <input
                type="email"
                defaultValue="support@pixelift.pl"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-green-500 focus:outline-none transition"
                disabled
              />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Users */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>👑</span>
          <span>Admin Users</span>
        </h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 mb-4">
            Admin users are configured in the{" "}
            <code className="px-2 py-1 bg-gray-900 text-green-400 rounded">
              lib/auth.ts
            </code>{" "}
            file.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-white">admin@pixelift.pl</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                ADMIN
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-white">michalchmielarz00@gmail.com</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Settings */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🔐</span>
          <span>Authentication</span>
        </h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
              <div>
                <div className="font-semibold text-white mb-1">Google OAuth</div>
                <div className="text-sm text-gray-400">Sign in with Google</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-semibold rounded">
                  ENABLED
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Variables */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>🌍</span>
          <span>Environment Variables</span>
        </h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <p className="text-gray-400 mb-4">
            Environment variables are configured in{" "}
            <code className="px-2 py-1 bg-gray-900 text-green-400 rounded">
              .env.local
            </code>{" "}
            file.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-white">GOOGLE_CLIENT_ID</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                SET
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-white">GOOGLE_CLIENT_SECRET</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                SET
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-white">NEXTAUTH_SECRET</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                SET
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
              <span className="text-white">NEXTAUTH_URL</span>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                SET
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>System Information</span>
        </h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Platform</div>
              <div className="text-white font-semibold">Pixelift</div>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Version</div>
              <div className="text-white font-semibold">1.0.0</div>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Framework</div>
              <div className="text-white font-semibold">Next.js 16</div>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Deployment</div>
              <div className="text-white font-semibold">Production</div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>⚠️</span>
          <span>Danger Zone</span>
        </h2>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Clear Cache</h3>
          <p className="text-gray-400 mb-4">
            Clear the application cache. This will force rebuild all pages on next request.
          </p>
          <button
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-400 font-semibold rounded-lg transition"
            disabled
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Notice */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>ℹ️</span>
          <span>Settings Notice</span>
        </h3>
        <p className="text-gray-300">
          Most settings are currently configured through environment variables and code.
          A full settings management interface with database persistence will be available in a future update.
        </p>
      </div>
    </div>
  );
}
