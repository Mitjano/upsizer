"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import WelcomeModal from "@/components/WelcomeModal";

interface DashboardStats {
  totalImages: number;
  credits: number;
  role: string;
  toolsAvailable: number;
  upscalerUsage: { count: number; credits: number };
  bgRemovalUsage: { count: number; credits: number };
  mostUsedTool: string;
  recentActivity: Array<{
    id: string;
    type: string;
    creditsUsed: number;
    date: string;
  }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      setLoading(true);
      fetch('/api/dashboard/stats')
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching dashboard stats:', err);
          setLoading(false);
        });

      // Check if new user and show welcome modal
      const welcomeShown = localStorage.getItem('pixelift_welcome_shown');
      if (!welcomeShown) {
        fetch('/api/user/welcome', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.emailSent) {
              setIsNewUser(true);
              setShowWelcomeModal(true);
              localStorage.setItem('pixelift_welcome_shown', 'true');
            }
          })
          .catch(err => console.error('Welcome check error:', err));
      }
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!session) return null;

  const tools = [
    {
      name: "Image Upscaler",
      description: "Enhance and enlarge images up to 8x",
      icon: "🔍",
      gradient: "from-purple-500 to-pink-500",
      href: "/tools/upscaler",
      available: true
    },
    {
      name: "Background Remover",
      description: "Remove backgrounds with AI",
      icon: "✂️",
      gradient: "from-blue-500 to-cyan-500",
      href: "/tools/remove-background",
      available: true
    },
    {
      name: "Face Restoration",
      description: "Restore and enhance face photos",
      icon: "😊",
      gradient: "from-green-500 to-emerald-500",
      href: "#",
      available: false,
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Welcome Modal for new users */}
      {showWelcomeModal && session?.user?.name && (
        <WelcomeModal
          userName={session.user.name}
          credits={stats?.credits || 3}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {session.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-400">
            Manage your account and view your image processing history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-green-400 text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold mb-1">
              {loading ? (
                <div className="h-8 w-16 bg-gray-700 animate-pulse rounded"></div>
              ) : (
                stats?.totalImages || 0
              )}
            </div>
            <div className="text-sm text-gray-400">Images Processed</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-blue-400 text-3xl mb-2">💎</div>
            <div className="text-2xl font-bold mb-1">
              {loading ? (
                <div className="h-8 w-16 bg-gray-700 animate-pulse rounded"></div>
              ) : (
                stats?.credits || 0
              )}
            </div>
            <div className="text-sm text-gray-400">Credits Remaining</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-purple-400 text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold mb-1 capitalize">
              {loading ? (
                <div className="h-8 w-20 bg-gray-700 animate-pulse rounded"></div>
              ) : (
                stats?.role === 'user' ? 'Free' : stats?.role || 'Free'
              )}
            </div>
            <div className="text-sm text-gray-400">Current Plan</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-yellow-400 text-3xl mb-2">🛠️</div>
            <div className="text-2xl font-bold mb-1">
              {loading ? (
                <div className="h-8 w-8 bg-gray-700 animate-pulse rounded"></div>
              ) : (
                stats?.toolsAvailable || 2
              )}
            </div>
            <div className="text-sm text-gray-400">Tools Available</div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">AI Tools</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className={`relative bg-gray-800/50 rounded-xl border border-gray-700 p-8 transition-all group ${
                  tool.available
                    ? 'hover:border-gray-500 hover:scale-105 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={(e) => !tool.available && e.preventDefault()}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-10 transition-opacity rounded-xl`}></div>

                {/* Content */}
                <div className="relative">
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">
                    {tool.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    {tool.name}
                    {tool.comingSoon && (
                      <span className="px-2 py-0.5 text-xs bg-gray-600 text-white rounded-full">
                        SOON
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">{tool.description}</p>

                  {tool.available && (
                    <div className="flex items-center text-green-400 text-sm font-medium">
                      Start using
                      <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Activity</h2>
          </div>

          {loading ? (
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-700 animate-pulse rounded"></div>
                ))}
              </div>
            </div>
          ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-700">
                {stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-800/50 transition flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'Image Upscaler'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {activity.type === 'Image Upscaler' ? '🔍' : '✂️'}
                      </div>
                      <div>
                        <div className="font-medium">{activity.type}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(activity.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      -{activity.creditsUsed} credit{activity.creditsUsed !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-8 text-center">
              <div className="text-6xl mb-4">📂</div>
              <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
              <p className="text-gray-400 mb-6">
                Start using our tools to see your processing history here
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/tools/upscaler"
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
                >
                  Try Upscaler
                </Link>
                <Link
                  href="/tools/remove-background"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
                >
                  Try Background Remover
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Usage Overview</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Credits Usage */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>💰</span> Credit Usage
              </h3>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-6 bg-gray-700 animate-pulse rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm">Image Upscaler</span>
                    </div>
                    <span className="text-sm font-medium">
                      {stats?.upscalerUsage.credits || 0} credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">Background Remover</span>
                    </div>
                    <span className="text-sm font-medium">
                      {stats?.bgRemovalUsage.credits || 0} credits
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Total Used</span>
                      <span className="font-bold">
                        {(stats?.upscalerUsage.credits || 0) + (stats?.bgRemovalUsage.credits || 0)} credits
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Most Used Tool */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📈</span> Most Used Tool
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="h-12 w-12 bg-gray-700 animate-pulse rounded-full mx-auto mb-3"></div>
                  <div className="h-6 w-32 bg-gray-700 animate-pulse rounded mx-auto"></div>
                </div>
              ) : stats?.mostUsedTool && stats.mostUsedTool !== 'None' ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">
                    {stats.mostUsedTool === 'Image Upscaler' ? '🔍' : '✂️'}
                  </div>
                  <p className="text-white font-semibold">{stats.mostUsedTool}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {stats.mostUsedTool === 'Image Upscaler'
                      ? `${stats.upscalerUsage.count} image${stats.upscalerUsage.count !== 1 ? 's' : ''} processed`
                      : `${stats.bgRemovalUsage.count} image${stats.bgRemovalUsage.count !== 1 ? 's' : ''} processed`
                    }
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-gray-400">No data yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start processing images to see statistics
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link
              href="/dashboard/images"
              className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 rounded-xl border border-indigo-700/50 p-6 hover:border-indigo-500 transition group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">🖼️</div>
              <h3 className="text-lg font-semibold mb-2">Image History</h3>
              <p className="text-gray-400 text-sm">
                View all processed images
              </p>
            </Link>

            <Link
              href="/dashboard/billing"
              className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-xl border border-yellow-700/50 p-6 hover:border-yellow-500 transition group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">💰</div>
              <h3 className="text-lg font-semibold mb-2">Billing</h3>
              <p className="text-gray-400 text-sm">
                Transactions & payments
              </p>
            </Link>

            <Link
              href="/pricing"
              className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-700/50 p-6 hover:border-green-500 transition group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">💎</div>
              <h3 className="text-lg font-semibold mb-2">Upgrade</h3>
              <p className="text-gray-400 text-sm">
                Get more credits
              </p>
            </Link>

            <Link
              href="/dashboard/api"
              className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-700/50 p-6 hover:border-blue-500 transition group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">🔑</div>
              <h3 className="text-lg font-semibold mb-2">API Keys</h3>
              <p className="text-gray-400 text-sm">
                For developers
              </p>
            </Link>

            <Link
              href="/support/tickets"
              className="bg-gradient-to-br from-pink-900/20 to-rose-900/20 rounded-xl border border-pink-700/50 p-6 hover:border-pink-500 transition group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">🎫</div>
              <h3 className="text-lg font-semibold mb-2">My Tickets</h3>
              <p className="text-gray-400 text-sm">
                Support requests
              </p>
            </Link>

            <Link
              href="/dashboard/settings"
              className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-700/50 p-6 hover:border-purple-500 transition group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition">⚙️</div>
              <h3 className="text-lg font-semibold mb-2">Settings</h3>
              <p className="text-gray-400 text-sm">
                Account preferences
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
