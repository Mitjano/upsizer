'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import ToolsLayout from '@/components/ToolsLayout';

// Lazy load heavy components
const BackgroundRemover = dynamic(
  () => import('@/components/BackgroundRemover').then((mod) => ({ default: mod.BackgroundRemover })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    ),
    ssr: false,
  }
);

const ProcessedImagesGallery = dynamic(
  () => import('@/components/ProcessedImagesGallery').then((mod) => ({ default: mod.ProcessedImagesGallery })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-gray-400">Loading gallery...</div>
      </div>
    ),
    ssr: false,
  }
);

export default function RemoveBackgroundPage() {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<'user' | 'premium' | 'admin'>('user');
  const [credits, setCredits] = useState(0);
  const t = useTranslations('removeBackgroundPage');

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => {
          if (data.role) setUserRole(data.role);
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
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-blue-300">{t('badge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-white">{t('titlePrefix')}</span>
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">5s</div>
                <div className="text-gray-400 text-sm mt-1">{t('stats.processing')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">256</div>
                <div className="text-gray-400 text-sm mt-1">{t('stats.alphaLevels')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white">1</div>
                <div className="text-gray-400 text-sm mt-1">{t('stats.creditPerImage')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <BackgroundRemover userRole={userRole} />
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
              icon: '⚡',
              titleKey: 'features.fast.title',
              descKey: 'features.fast.description',
              gradient: 'from-yellow-500/20 to-orange-500/20',
            },
            {
              icon: '🎯',
              titleKey: 'features.precise.title',
              descKey: 'features.precise.description',
              gradient: 'from-blue-500/20 to-cyan-500/20',
            },
            {
              icon: '🔒',
              titleKey: 'features.secure.title',
              descKey: 'features.secure.description',
              gradient: 'from-green-500/20 to-emerald-500/20',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{t(feature.titleKey)}</h3>
              <p className="text-gray-400">{t(feature.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-white">{t('gallery.titlePrefix')}</span>
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{t('gallery.title')}</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('gallery.subtitle')}
          </p>
        </div>

        <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden p-6">
          <ProcessedImagesGallery userRole={userRole} />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">{t('howItWorks.titlePrefix')}</span>
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{t('howItWorks.title')}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-400">{t('howItWorks.technology.title')}</h3>
              <p className="text-gray-400 mb-4">
                {t('howItWorks.technology.description')}
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{t('howItWorks.technology.feature1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{t('howItWorks.technology.feature2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{t('howItWorks.technology.feature3')}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">{t('howItWorks.perfectFor.title')}</h3>
              <div className="space-y-3 text-gray-400">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">🛍️ {t('howItWorks.perfectFor.ecommerce')}</strong> {t('howItWorks.perfectFor.ecommerceDesc')}
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">📱 {t('howItWorks.perfectFor.social')}</strong> {t('howItWorks.perfectFor.socialDesc')}
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">🎨 {t('howItWorks.perfectFor.design')}</strong> {t('howItWorks.perfectFor.designDesc')}
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">💼 {t('howItWorks.perfectFor.professional')}</strong> {t('howItWorks.perfectFor.professionalDesc')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('useCases.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🛒',
              titleKey: 'useCases.ecommerce.title',
              descKey: 'useCases.ecommerce.description',
              detailKey: 'useCases.ecommerce.detail',
            },
            {
              icon: '📸',
              titleKey: 'useCases.profile.title',
              descKey: 'useCases.profile.description',
              detailKey: 'useCases.profile.detail',
            },
            {
              icon: '🎨',
              titleKey: 'useCases.design.title',
              descKey: 'useCases.design.description',
              detailKey: 'useCases.design.detail',
            },
            {
              icon: '📱',
              titleKey: 'useCases.social.title',
              descKey: 'useCases.social.description',
              detailKey: 'useCases.social.detail',
            },
            {
              icon: '🏠',
              titleKey: 'useCases.realEstate.title',
              descKey: 'useCases.realEstate.description',
              detailKey: 'useCases.realEstate.detail',
            },
            {
              icon: '💍',
              titleKey: 'useCases.wedding.title',
              descKey: 'useCases.wedding.description',
              detailKey: 'useCases.wedding.detail',
            },
          ].map((useCase, idx) => (
            <div key={idx} className="bg-gray-800/30 rounded-xl border border-gray-700 p-6 hover:border-blue-500/50 transition">
              <div className="text-3xl mb-3">{useCase.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-white">{t(useCase.titleKey)}</h3>
              <p className="text-sm text-gray-400 mb-3">{t(useCase.descKey)}</p>
              <div className="text-xs text-gray-500">{t(useCase.detailKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Download Options & Formats */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🎯</span> {t('downloadOptions.title')}
            </h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <strong className="text-white">{t('downloadOptions.low')}</strong> {t('downloadOptions.lowDesc')}
              </div>
              <div>
                <strong className="text-white">{t('downloadOptions.medium')}</strong> {t('downloadOptions.mediumDesc')}
              </div>
              <div>
                <strong className="text-white">{t('downloadOptions.high')}</strong> {t('downloadOptions.highDesc')}
              </div>
              <div>
                <strong className="text-white">{t('downloadOptions.original')}</strong> {t('downloadOptions.originalDesc')}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📋</span> {t('formatQuality.title')}
            </h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <strong className="text-white">{t('formatQuality.png')}</strong> {t('formatQuality.pngDesc')}
              </div>
              <div>
                <strong className="text-white">{t('formatQuality.jpg')}</strong> {t('formatQuality.jpgDesc')}
              </div>
              <div>
                <strong className="text-white">{t('formatQuality.processingTime')}</strong> {t('formatQuality.processingTimeDesc')}
              </div>
              <div>
                <strong className="text-white">{t('formatQuality.creditCost')}</strong> {t('formatQuality.creditCostDesc')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold mb-6">💡 {t('tips.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-400">
            <div>
              <h4 className="font-semibold text-white mb-2">✓ {t('tips.bestPractices.title')}</h4>
              <ul className="space-y-2 text-sm">
                <li>• {t('tips.bestPractices.tip1')}</li>
                <li>• {t('tips.bestPractices.tip2')}</li>
                <li>• {t('tips.bestPractices.tip3')}</li>
                <li>• {t('tips.bestPractices.tip4')}</li>
                <li>• {t('tips.bestPractices.tip5')}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">⚡ {t('tips.proTips.title')}</h4>
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
        <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border border-blue-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('cta.title')}
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            {t('cta.subtitle')}
          </p>
          {!session ? (
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-lg transition"
            >
              {t('cta.getStarted')}
            </Link>
          ) : (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-lg transition"
            >
              {t('cta.startRemoving')}
            </button>
          )}
        </div>
      </section>
    </ToolsLayout>
  );
}
