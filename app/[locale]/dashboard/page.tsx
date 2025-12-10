"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';
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

// Featured tools (hero section)
const featuredTools = [
  {
    nameKey: 'upscaler',
    href: '/tools/upscaler',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    ),
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-green-500/10 to-emerald-600/10',
    iconColor: 'text-green-400',
    credits: '1-3',
    badge: 'POPULAR',
  },
  {
    nameKey: 'bgRemover',
    href: '/tools/remove-background',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-500/10 to-blue-600/10',
    iconColor: 'text-blue-400',
    credits: '1',
  },
  {
    nameKey: 'objectRemoval',
    href: '/tools/object-removal',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-orange-500/10 to-red-600/10',
    iconColor: 'text-orange-400',
    credits: '2',
    badge: 'NEW',
  },
];

// All tools (compact grid)
const allTools = [
  { nameKey: 'upscaler', href: '/tools/upscaler', icon: '📈', color: 'text-green-400', credits: '1-3' },
  { nameKey: 'bgRemover', href: '/tools/remove-background', icon: '🖼️', color: 'text-blue-400', credits: '1' },
  { nameKey: 'colorize', href: '/tools/colorize', icon: '🎨', color: 'text-violet-400', credits: '1', badge: 'NEW' },
  { nameKey: 'restore', href: '/tools/restore', icon: '✨', color: 'text-cyan-400', credits: '1', badge: 'NEW' },
  { nameKey: 'objectRemoval', href: '/tools/object-removal', icon: '🗑️', color: 'text-orange-400', credits: '2', badge: 'NEW' },
  { nameKey: 'bgGenerator', href: '/tools/background-generator', icon: '🌟', color: 'text-pink-400', credits: '3', badge: 'NEW' },
  { nameKey: 'compressor', href: '/tools/image-compressor', icon: '📦', color: 'text-teal-400', credits: 'free' },
  { nameKey: 'packshot', href: '/tools/packshot-generator', icon: '📷', color: 'text-amber-400', credits: '2' },
  { nameKey: 'expand', href: '/tools/image-expand', icon: '↔️', color: 'text-indigo-400', credits: '2' },
  { nameKey: 'inpainting', href: '/tools/inpainting', icon: '🖌️', color: 'text-cyan-400', credits: '2', badge: 'NEW' },
  { nameKey: 'reimagine', href: '/tools/reimagine', icon: '🔮', color: 'text-violet-400', credits: '2', badge: 'NEW' },
  { nameKey: 'styleTransfer', href: '/tools/style-transfer', icon: '🎭', color: 'text-pink-400', credits: '3', badge: 'NEW' },
  { nameKey: 'structureControl', href: '/tools/structure-control', icon: '🏗️', color: 'text-amber-400', credits: '2', badge: 'NEW' },
];

// Quick actions
const quickActions = [
  { nameKey: 'imageHistory', href: '/dashboard/images', icon: '🖼️' },
  { nameKey: 'billing', href: '/dashboard/billing', icon: '💳' },
  { nameKey: 'apiKeys', href: '/dashboard/api', icon: '🔑' },
  { nameKey: 'settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

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

      const welcomeShown = localStorage.getItem('pixelift_welcome_shown');
      if (!welcomeShown) {
        fetch('/api/user/welcome', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            if (data.emailSent) {
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
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!session) return null;

  const isLowCredits = stats && stats.credits < 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">
      {showWelcomeModal && session?.user?.name && (
        <WelcomeModal
          userName={session.user.name}
          credits={stats?.credits || 3}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Compact Header with Stats */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            {t('welcomeBack')}, {session.user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-500 text-sm">{t('manageAccount')}</p>
        </div>

        {/* Stats Bar - Compact horizontal layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {/* Credits */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                {loading ? (
                  <div className="h-6 w-16 bg-gray-300 dark:bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  <div className={`text-xl font-bold ${isLowCredits ? 'text-orange-500 dark:text-orange-400' : 'text-blue-500 dark:text-blue-400'}`}>
                    {stats?.credits?.toLocaleString() || 0}
                  </div>
                )}
                <div className="text-xs text-gray-500">{t('stats.creditsRemaining')}</div>
              </div>
            </div>
            {isLowCredits && (
              <Link href="/pricing" className="mt-2 block text-xs text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300">
                + {t('quickActions.getMoreCredits')}
              </Link>
            )}
          </div>

          {/* Images Processed */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                {loading ? (
                  <div className="h-6 w-12 bg-gray-300 dark:bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  <div className="text-xl font-bold text-green-500 dark:text-green-400">{stats?.totalImages || 0}</div>
                )}
                <div className="text-xs text-gray-500">{t('stats.imagesProcessed')}</div>
              </div>
            </div>
          </div>

          {/* Current Plan */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                {loading ? (
                  <div className="h-6 w-16 bg-gray-300 dark:bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  <div className="text-xl font-bold text-purple-500 dark:text-purple-400 capitalize">
                    {stats?.role === 'user' ? t('plans.free') : stats?.role || t('plans.free')}
                  </div>
                )}
                <div className="text-xs text-gray-500">{t('stats.currentPlan')}</div>
              </div>
            </div>
          </div>

          {/* Tools Available */}
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-cyan-500 dark:text-cyan-400">{allTools.length}</div>
                <div className="text-xs text-gray-500">{t('tools.available')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Tools - Hero Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('tools.title')}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {featuredTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group relative bg-gradient-to-br ${tool.bgGradient} backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 p-6 transition-all duration-300 hover:scale-[1.02] overflow-hidden`}
              >
                {/* Badge */}
                {tool.badge && (
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${
                      tool.badge === 'POPULAR' ? 'bg-green-500' : 'bg-orange-500'
                    }`}>
                      {tool.badge}
                    </span>
                  </div>
                )}

                <div className={`w-14 h-14 bg-gradient-to-br ${tool.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <div className="text-white">{tool.icon}</div>
                </div>

                <h3 className="text-lg font-bold mb-1 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {t(`tools.${tool.nameKey}.name`)}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                  {t(`tools.${tool.nameKey}.description`)}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 bg-gray-200/80 dark:bg-gray-800/80 px-2 py-1 rounded-full">
                    {tool.credits === 'free' ? t('tools.free') : `${tool.credits} ${t('tools.credits')}`}
                  </span>
                  <span className={`text-sm font-medium ${tool.iconColor} group-hover:translate-x-1 transition-transform inline-flex items-center gap-1`}>
                    {t('tools.startUsing')} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* All Tools - Compact Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">All Tools ({allTools.length})</h3>
            <Link href="/tools" className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Explore tools →</Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-13 gap-2">
            {allTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative bg-gray-100/30 dark:bg-gray-800/30 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 rounded-xl p-3 text-center transition-all border border-transparent hover:border-gray-300/50 dark:hover:border-gray-700/50"
              >
                {tool.badge && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
                )}
                <div className="text-2xl mb-1">{tool.icon}</div>
                <div className={`text-xs font-medium ${tool.color} truncate`}>
                  {t(`tools.${tool.nameKey}.name`)}
                </div>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {tool.credits === 'free' ? t('tools.free') : `${tool.credits} ${t('tools.credits')}`}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Section - Quick Actions + Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('quickActions.title')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 bg-gray-100/30 dark:bg-gray-800/30 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 rounded-xl transition-all border border-transparent hover:border-gray-300/50 dark:hover:border-gray-700/50"
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-sm font-medium">{t(`quickActions.${action.nameKey}`)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('activity.title')}</h3>
            {loading ? (
              <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-xl p-4">
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-gray-300/50 dark:bg-gray-700/50 animate-pulse rounded-lg"></div>
                  ))}
                </div>
              </div>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-xl overflow-hidden">
                <div className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                  {stats.recentActivity.slice(0, 4).map((activity) => (
                    <div key={activity.id} className="p-3 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                          activity.type === 'Image Upscaler'
                            ? 'bg-green-500/20 text-green-500 dark:text-green-400'
                            : 'bg-blue-500/20 text-blue-500 dark:text-blue-400'
                        }`}>
                          {activity.type === 'Image Upscaler' ? '📈' : '🖼️'}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{activity.type}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        -{activity.creditsUsed} {t('activity.credits')}
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/dashboard/images"
                  className="block text-center py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-t border-gray-200/30 dark:border-gray-700/30"
                >
                  View all activity →
                </Link>
              </div>
            ) : (
              <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-xl p-6 text-center">
                <div className="text-3xl mb-2">📷</div>
                <h4 className="font-medium mb-1">{t('activity.noActivity')}</h4>
                <p className="text-gray-500 text-xs mb-3">{t('activity.noActivityDesc')}</p>
                <Link
                  href="/tools/upscaler"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition"
                >
                  {t('activity.tryUpscaler')} →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
