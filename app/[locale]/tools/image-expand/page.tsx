'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import ToolsLayout from '@/components/ToolsLayout';

// Lazy load heavy component
const ImageExpander = dynamic(
  () => import('@/components/ImageExpander').then((mod) => ({ default: mod.ImageExpander })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function ImageExpandPage() {
  const { data: session } = useSession();
  const [userRole, setUserRole] = useState<'user' | 'premium' | 'admin'>('user');
  const [credits, setCredits] = useState(0);
  const t = useTranslations('imageExpandPage');

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user')
        .then((res) => res.json())
        .then((data) => {
          if (data.role) setUserRole(data.role);
          if (data.credits !== undefined) setCredits(data.credits);
        })
        .catch((err) => console.error('Error fetching user data:', err));
    }
  }, [session]);

  return (
    <ToolsLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-100/50 dark:from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-100/50 dark:bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-indigo-100/50 dark:bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-purple-600 dark:text-purple-300">{t('badge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gray-900 dark:text-white">{t('titlePrefix')}</span>
              <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{t('stats.maxZoom')}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">{t('stats.maxZoomLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{t('stats.processing')}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">{t('stats.processingLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{t('stats.creditCost')}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">{t('stats.creditCostLabel')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <ImageExpander userRole={userRole} />
          <p className="text-sm text-gray-500 mt-4 text-center">
            {t('termsNotice')}
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🔍',
              titleKey: 'features.zoomOut.title',
              descKey: 'features.zoomOut.description',
              gradient: 'from-purple-100 dark:from-purple-500/20 to-indigo-100 dark:to-indigo-500/20',
            },
            {
              icon: '⬜',
              titleKey: 'features.makeSquare.title',
              descKey: 'features.makeSquare.description',
              gradient: 'from-blue-100 dark:from-blue-500/20 to-cyan-100 dark:to-cyan-500/20',
            },
            {
              icon: '↔️',
              titleKey: 'features.directional.title',
              descKey: 'features.directional.description',
              gradient: 'from-green-100 dark:from-green-500/20 to-emerald-100 dark:to-emerald-500/20',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t(feature.titleKey)}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t(feature.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-100/50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gray-900 dark:text-white">{t('howItWorks.title')}</span>
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">{t('howItWorks.titleHighlight')}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6">
              <div className="text-4xl mb-3">📤</div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('howItWorks.step1.title')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('howItWorks.step1.description')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6">
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('howItWorks.step2.title')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('howItWorks.step2.description')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6">
              <div className="text-4xl mb-3">🤖</div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('howItWorks.step3.title')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('howItWorks.step3.description')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6">
              <div className="text-4xl mb-3">💾</div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('howItWorks.step4.title')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('howItWorks.step4.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Expand Options */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-purple-100/50 dark:from-purple-900/20 to-indigo-100/50 dark:to-indigo-900/20 rounded-xl border border-purple-300 dark:border-purple-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🎨</span> {t('expandModes.title')}
            </h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div>
                <strong className="text-gray-900 dark:text-white">{t('expandModes.zoom15.title')}</strong> {t('expandModes.zoom15.description')}
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">{t('expandModes.zoom2.title')}</strong> {t('expandModes.zoom2.description')}
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">{t('expandModes.makeSquare.title')}</strong> {t('expandModes.makeSquare.description')}
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">{t('expandModes.directional.title')}</strong> {t('expandModes.directional.description')}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-100/50 dark:from-indigo-900/20 to-purple-100/50 dark:to-purple-900/20 rounded-xl border border-indigo-300 dark:border-indigo-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>✨</span> {t('featuresPanel.title')}
            </h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div>
                <strong className="text-gray-900 dark:text-white">{t('featuresPanel.fluxModel.title')}</strong> {t('featuresPanel.fluxModel.description')}
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">{t('featuresPanel.customPrompts.title')}</strong> {t('featuresPanel.customPrompts.description')}
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">{t('featuresPanel.highQuality.title')}</strong> {t('featuresPanel.highQuality.description')}
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">{t('featuresPanel.fastProcessing.title')}</strong> {t('featuresPanel.fastProcessing.description')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('useCases.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '📱',
              titleKey: 'useCases.socialMedia.title',
              descKey: 'useCases.socialMedia.description',
              detailKey: 'useCases.socialMedia.detail',
            },
            {
              icon: '🛍️',
              titleKey: 'useCases.ecommerce.title',
              descKey: 'useCases.ecommerce.description',
              detailKey: 'useCases.ecommerce.detail',
            },
            {
              icon: '🎬',
              titleKey: 'useCases.contentCreators.title',
              descKey: 'useCases.contentCreators.description',
              detailKey: 'useCases.contentCreators.detail',
            },
          ].map((useCase, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-purple-500/50 transition">
              <div className="text-3xl mb-3">{useCase.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{t(useCase.titleKey)}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t(useCase.descKey)}</p>
              <div className="text-xs text-gray-500">{t(useCase.detailKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gray-100 dark:bg-gray-800/20 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{t('tips.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('tips.bestPractices.title')}</h4>
              <ul className="space-y-2 text-sm">
                <li>• {t('tips.bestPractices.tip1')}</li>
                <li>• {t('tips.bestPractices.tip2')}</li>
                <li>• {t('tips.bestPractices.tip3')}</li>
                <li>• {t('tips.bestPractices.tip4')}</li>
                <li>• {t('tips.bestPractices.tip5')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('tips.proTips.title')}</h4>
              <ul className="space-y-2 text-sm">
                <li>• {t('tips.proTips.tip1')}</li>
                <li>• {t('tips.proTips.tip2')}</li>
                <li>• {t('tips.proTips.tip3')}</li>
                <li>• {t('tips.proTips.tip4')}</li>
                <li>• {t('tips.proTips.tip5')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 border border-purple-300 dark:border-purple-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('cta.title')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            {t('cta.subtitle')}
          </p>
          {!session ? (
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 rounded-xl font-semibold text-lg transition"
            >
              {t('cta.getStarted')}
            </Link>
          ) : (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 rounded-xl font-semibold text-lg transition"
            >
              {t('cta.startExpanding')}
            </button>
          )}
        </div>
      </section>
    </ToolsLayout>
  );
}
