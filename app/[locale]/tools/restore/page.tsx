'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import ToolsLayout from '@/components/ToolsLayout';

// Lazy load heavy component
const ImageDenoiser = dynamic(
  () => import('@/components/ImageDenoiser'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function RestorePage() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);
  const t = useTranslations('restorePage');

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
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-100/50 dark:from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 dark:bg-cyan-600/20 border border-cyan-300 dark:border-cyan-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-cyan-600 dark:text-cyan-300">{t('badge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gray-900 dark:text-white">{t('titlePrefix')}</span>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{t('stats.modes')}</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">{t('stats.modesLabel')}</div>
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
          <ImageDenoiser />
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
              icon: '🔇',
              titleKey: 'features.noiseRemoval.title',
              descKey: 'features.noiseRemoval.description',
              gradient: 'from-cyan-100 dark:from-cyan-500/20 to-blue-100 dark:to-blue-500/20',
            },
            {
              icon: '📦',
              titleKey: 'features.jpegArtifacts.title',
              descKey: 'features.jpegArtifacts.description',
              gradient: 'from-blue-100 dark:from-blue-500/20 to-indigo-100 dark:to-indigo-500/20',
            },
            {
              icon: '✨',
              titleKey: 'features.superResolution.title',
              descKey: 'features.superResolution.description',
              gradient: 'from-indigo-100 dark:from-indigo-500/20 to-purple-100 dark:to-purple-500/20',
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
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{t('howItWorks.titleHighlight')}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-600 dark:text-cyan-400">{t('howItWorks.technology.title')}</h3>
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
              <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">{t('howItWorks.modes.title')}</h3>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-gray-900 dark:text-white">{t('howItWorks.modes.superResolution.title')}</strong> {t('howItWorks.modes.superResolution.description')}
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-gray-900 dark:text-white">{t('howItWorks.modes.denoise.title')}</strong> {t('howItWorks.modes.denoise.description')}
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-gray-900 dark:text-white">{t('howItWorks.modes.jpegArtifacts.title')}</strong> {t('howItWorks.modes.jpegArtifacts.description')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('useCases.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '📷',
              titleKey: 'useCases.lowLight.title',
              descKey: 'useCases.lowLight.description',
              detailKey: 'useCases.lowLight.detail',
            },
            {
              icon: '🌐',
              titleKey: 'useCases.webImages.title',
              descKey: 'useCases.webImages.description',
              detailKey: 'useCases.webImages.detail',
            },
            {
              icon: '📸',
              titleKey: 'useCases.oldPhotos.title',
              descKey: 'useCases.oldPhotos.description',
              detailKey: 'useCases.oldPhotos.detail',
            },
          ].map((useCase, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-cyan-500/50 transition">
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
        <div className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 border border-cyan-300 dark:border-cyan-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('cta.title')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            {t('cta.subtitle')}
          </p>
          {!session ? (
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 rounded-xl font-semibold text-lg transition"
            >
              {t('cta.getStarted')}
            </Link>
          ) : (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 rounded-xl font-semibold text-lg transition"
            >
              {t('cta.startRestoring')}
            </button>
          )}
        </div>
      </section>
    </ToolsLayout>
  );
}
