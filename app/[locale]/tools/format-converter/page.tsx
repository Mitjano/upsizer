'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Lazy load heavy component
const FormatConverter = dynamic(
  () => import('@/components/FormatConverter'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function FormatConverterPage() {
  const { data: session } = useSession();
  const t = useTranslations('formatConverterPage');

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-100/50 dark:from-emerald-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-600/20 border border-emerald-300 dark:border-emerald-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-300">{t('badge')}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto mb-8">
              {t('subtitle')}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{t('stats.formats')}</div>
                <div className="text-sm text-gray-500">{t('stats.formatsLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{t('stats.processing')}</div>
                <div className="text-sm text-gray-500">{t('stats.processingLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{t('stats.creditCost')}</div>
                <div className="text-sm text-gray-500">{t('stats.creditCostLabel')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool Section */}
        <section className="px-6 mb-12">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <FormatConverter />
            <p className="text-sm text-gray-500 mt-4 text-center">
              {t('termsNotice')}
            </p>
          </div>
        </section>

        {/* Supported Formats Grid */}
        <section className="px-6 mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">{t('supportedFormats.title')}</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-amber-100 dark:from-amber-900/20 to-orange-100 dark:to-orange-900/20 rounded-xl border border-gray-200 dark:border-amber-700/30 p-6 text-center">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">JPG</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('supportedFormats.jpg')}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 dark:from-blue-900/20 to-indigo-100 dark:to-indigo-900/20 rounded-xl border border-gray-200 dark:border-blue-700/30 p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">PNG</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('supportedFormats.png')}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-100 dark:from-emerald-900/20 to-green-100 dark:to-green-900/20 rounded-xl border border-gray-200 dark:border-emerald-700/30 p-6 text-center">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">WebP</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('supportedFormats.webp')}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 dark:from-purple-900/20 to-violet-100 dark:to-violet-900/20 rounded-xl border border-gray-200 dark:border-purple-700/30 p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">AVIF</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('supportedFormats.avif')}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-100 dark:from-pink-900/20 to-rose-100 dark:to-rose-900/20 rounded-xl border border-gray-200 dark:border-pink-700/30 p-6 text-center">
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-2">GIF</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('supportedFormats.gif')}</p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-emerald-100 dark:from-emerald-900/20 to-teal-100 dark:to-teal-900/20 rounded-xl border border-gray-200 dark:border-emerald-700/30 p-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.instantConversion.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('features.instantConversion.description')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-100 dark:from-teal-900/20 to-emerald-100 dark:to-emerald-900/20 rounded-xl border border-gray-200 dark:border-teal-700/30 p-6">
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎛️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.qualityControl.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('features.qualityControl.description')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-100 dark:from-green-900/20 to-emerald-100 dark:to-emerald-900/20 rounded-xl border border-gray-200 dark:border-green-700/30 p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🆓</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.completelyFree.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('features.completelyFree.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="px-6 mb-16">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-8 text-center">{t('useCases.title')}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-emerald-600 dark:text-emerald-400">{t('useCases.webOptimization.title')}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('useCases.webOptimization.description')}
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                    <span>{t('useCases.webOptimization.feature1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                    <span>{t('useCases.webOptimization.feature2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                    <span>{t('useCases.webOptimization.feature3')}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-teal-600 dark:text-teal-400">{t('useCases.compatibility.title')}</h3>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-gray-900 dark:text-white">🖼️ {t('useCases.compatibility.socialMedia')}</strong> {t('useCases.compatibility.socialMediaDesc')}
                  </div>
                  <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-gray-900 dark:text-white">📱 {t('useCases.compatibility.apps')}</strong> {t('useCases.compatibility.appsDesc')}
                  </div>
                  <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-gray-900 dark:text-white">🖨️ {t('useCases.compatibility.print')}</strong> {t('useCases.compatibility.printDesc')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Format Comparison */}
        <section className="px-6 mb-16">
          <div className="bg-gradient-to-br from-emerald-100 dark:from-emerald-900/20 to-teal-100 dark:to-teal-900/20 rounded-xl border border-gray-200 dark:border-emerald-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📊</span> {t('formatComparison.title')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">{t('formatComparison.format')}</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">{t('formatComparison.size')}</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">{t('formatComparison.quality')}</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-900 dark:text-white">{t('formatComparison.transparency')}</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-900 dark:text-white">{t('formatComparison.bestFor')}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 dark:text-gray-300">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">JPG</td>
                    <td className="py-3 px-2 text-center">🟢 {t('formatComparison.small')}</td>
                    <td className="py-3 px-2 text-center">🟡 {t('formatComparison.good')}</td>
                    <td className="py-3 px-2 text-center">❌</td>
                    <td className="py-3 px-2">{t('formatComparison.jpgBest')}</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">PNG</td>
                    <td className="py-3 px-2 text-center">🔴 {t('formatComparison.large')}</td>
                    <td className="py-3 px-2 text-center">🟢 {t('formatComparison.excellent')}</td>
                    <td className="py-3 px-2 text-center">✅</td>
                    <td className="py-3 px-2">{t('formatComparison.pngBest')}</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">WebP</td>
                    <td className="py-3 px-2 text-center">🟢 {t('formatComparison.small')}</td>
                    <td className="py-3 px-2 text-center">🟢 {t('formatComparison.excellent')}</td>
                    <td className="py-3 px-2 text-center">✅</td>
                    <td className="py-3 px-2">{t('formatComparison.webpBest')}</td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">AVIF</td>
                    <td className="py-3 px-2 text-center">🟢 {t('formatComparison.smallest')}</td>
                    <td className="py-3 px-2 text-center">🟢 {t('formatComparison.excellent')}</td>
                    <td className="py-3 px-2 text-center">✅</td>
                    <td className="py-3 px-2">{t('formatComparison.avifBest')}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">GIF</td>
                    <td className="py-3 px-2 text-center">🟡 {t('formatComparison.medium')}</td>
                    <td className="py-3 px-2 text-center">🔴 {t('formatComparison.limited')}</td>
                    <td className="py-3 px-2 text-center">✅</td>
                    <td className="py-3 px-2">{t('formatComparison.gifBest')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-12">
          <div className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl border border-emerald-300 dark:border-emerald-700/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('cta.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/tools"
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold transition"
              >
                {t('cta.exploreTools')}
              </Link>
              <Link
                href="/pricing"
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold transition text-gray-900 dark:text-white"
              >
                {t('cta.viewPricing')}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ToolsLayout>
  );
}
