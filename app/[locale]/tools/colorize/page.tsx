'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import ToolsLayout from '@/components/ToolsLayout';

// Lazy load heavy component
const ImageColorizer = dynamic(
  () => import('@/components/ImageColorizer'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function ColorizePage() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);
  const t = useTranslations('colorizePage');

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => {
          if (data.credits !== undefined) setCredits(data.credits);
        })
        .catch(err => console.error('Error fetching user data:', err));
    }
  }, [session]);

  return (
    <ToolsLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-100/50 dark:from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl" />
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
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{t('stats.naturalColors')}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">{t('stats.naturalColorsLabel')}</div>
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
          <ImageColorizer />
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
              icon: '🎨',
              titleKey: 'features.naturalColors.title',
              descKey: 'features.naturalColors.description',
              gradient: 'from-purple-100 dark:from-purple-500/20 to-pink-100 dark:to-pink-500/20',
            },
            {
              icon: '📸',
              titleKey: 'features.historicalPhotos.title',
              descKey: 'features.historicalPhotos.description',
              gradient: 'from-blue-100 dark:from-blue-500/20 to-cyan-100 dark:to-cyan-500/20',
            },
            {
              icon: '⚡',
              titleKey: 'features.fastProcessing.title',
              descKey: 'features.fastProcessing.description',
              gradient: 'from-yellow-100 dark:from-yellow-500/20 to-orange-100 dark:to-orange-500/20',
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
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t('howItWorks.titleHighlight')}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-600 dark:text-purple-400">{t('howItWorks.technology.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('howItWorks.technology.description')}
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                  <span>{t('howItWorks.technology.feature1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                  <span>{t('howItWorks.technology.feature2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                  <span>{t('howItWorks.technology.feature3')}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-pink-600 dark:text-pink-400">{t('howItWorks.perfectFor.title')}</h3>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-gray-900 dark:text-white">{t('howItWorks.perfectFor.familyArchives.title')}</strong> {t('howItWorks.perfectFor.familyArchives.description')}
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-gray-900 dark:text-white">{t('howItWorks.perfectFor.historicalImages.title')}</strong> {t('howItWorks.perfectFor.historicalImages.description')}
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-gray-900 dark:text-white">{t('howItWorks.perfectFor.filmRestoration.title')}</strong> {t('howItWorks.perfectFor.filmRestoration.description')}
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-gray-900 dark:text-white">{t('howItWorks.perfectFor.creativeProjects.title')}</strong> {t('howItWorks.perfectFor.creativeProjects.description')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
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
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('tips.proTips.title')}</h4>
              <ul className="space-y-2 text-sm">
                <li>• {t('tips.proTips.tip1')}</li>
                <li>• {t('tips.proTips.tip2')}</li>
                <li>• {t('tips.proTips.tip3')}</li>
                <li>• {t('tips.proTips.tip4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 border border-purple-300 dark:border-purple-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('cta.title')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            {t('cta.subtitle')}
          </p>
          {!session ? (
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold text-lg transition"
            >
              {t('cta.getStarted')}
            </Link>
          ) : (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold text-lg transition"
            >
              {t('cta.startColorizing')}
            </button>
          )}
        </div>
      </section>
    </ToolsLayout>
  );
}
