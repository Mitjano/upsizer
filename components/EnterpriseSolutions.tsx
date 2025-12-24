"use client";

import { useTranslations } from 'next-intl';

export default function EnterpriseSolutions() {
  const t = useTranslations('enterprise');

  return (
    <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            {t('title')}
          </span>
        </h2>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Bulk Transformation */}
        <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-2xl p-8 hover:border-purple-500 transition-all shadow-sm">
          <div className="bg-purple-100 dark:bg-purple-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold mb-4">{t('bulk.title')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('bulk.description')}
          </p>

          <ul className="space-y-3 mb-6">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <li key={index} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-600 dark:text-gray-300">{t(`bulk.features.f${index}`)}</span>
              </li>
            ))}
          </ul>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('bulk.stats.speed')}</span>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">~10s {t('bulk.stats.perImage')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{t('bulk.stats.maxBatch')}</span>
              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">{t('bulk.stats.unlimited')}</span>
            </div>
          </div>
        </div>

        {/* API Integration */}
        <div className="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-2xl p-8 hover:border-pink-500 transition-all shadow-sm">
          <div className="bg-pink-100 dark:bg-pink-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold mb-4">{t('api.title')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('api.description')}
          </p>

          <ul className="space-y-3 mb-6">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <li key={index} className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-pink-500 dark:text-pink-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-600 dark:text-gray-300">{t(`api.features.f${index}`)}</span>
              </li>
            ))}
          </ul>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
            <code className="text-xs text-green-600 dark:text-green-400 block mb-2">POST /api/v1/upscale</code>
            <div className="text-xs text-gray-500">
              curl -X POST \<br />
              &nbsp;&nbsp;-H &quot;Authorization: Bearer YOUR_KEY&quot; \<br />
              &nbsp;&nbsp;-F &quot;image=@photo.jpg&quot; \<br />
              &nbsp;&nbsp;-F &quot;scale=4&quot;
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Features Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12 max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="text-3xl mb-3">🔒</div>
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('features.secure.title')}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('features.secure.description')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="text-3xl mb-3">⚡</div>
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('features.fast.title')}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('features.fast.description')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="text-3xl mb-3">📊</div>
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('features.analytics.title')}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('features.analytics.description')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="text-3xl mb-3">💬</div>
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('features.support.title')}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('features.support.description')}</p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-16 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/50 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto">
        <h3 className="text-3xl font-bold mb-4">
          {t('cta.title')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          {t('cta.subtitle')}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold text-lg text-white transition shadow-lg">
            {t('cta.contactSales')}
          </button>
          <button className="px-8 py-4 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-lg transition">
            {t('cta.viewDocs')}
          </button>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 text-sm text-gray-500 dark:text-gray-400">
          <div>✓ {t('cta.badges.sla')}</div>
          <div>✓ {t('cta.badges.volume')}</div>
          <div>✓ {t('cta.badges.whiteLabel')}</div>
        </div>
      </div>
    </section>
  );
}
