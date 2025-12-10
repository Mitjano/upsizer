"use client";

import { useTranslations } from 'next-intl';

export default function SEOContent() {
  const t = useTranslations('seoContent');

  return (
    <section className="container mx-auto px-4 py-16 bg-gray-100/30 dark:bg-gray-900/30">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center">
          {t('mainTitle')}
        </h2>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <div className="grid md:grid-cols-2 gap-8 text-gray-600 dark:text-gray-300">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t('whatIs.title')}
              </h3>
              <p className="mb-4 leading-relaxed">
                {t('whatIs.p1')}
              </p>
              <p className="mb-4 leading-relaxed">
                {t('whatIs.p2')}
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {t('whyChoose.title')}
              </h3>
              <ul className="space-y-2 mb-4">
                {[1, 2, 3, 4, 5, 6].map((index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                    <span><strong>{t(`whyChoose.features.f${index}.title`)}</strong> {t(`whyChoose.features.f${index}.description`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('useCases.title')}
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">{t('useCases.photography.title')}</h4>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {t('useCases.photography.description')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">{t('useCases.ecommerce.title')}</h4>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {t('useCases.ecommerce.description')}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">{t('useCases.digitalArt.title')}</h4>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {t('useCases.digitalArt.description')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('howItWorks.title')}
            </h3>
            <div className="bg-gray-100/30 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <ol className="space-y-3 text-gray-600 dark:text-gray-300">
                {[1, 2, 3, 4].map((step) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">{step}</span>
                    <div>
                      <strong className="text-gray-900 dark:text-white">{t(`howItWorks.steps.s${step}.title`)}</strong> {t(`howItWorks.steps.s${step}.description`)}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-8 text-center bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {t('cta.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-lg transition shadow-lg inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {t('cta.button')}
            </button>
          </div>

          <div className="mt-8 grid md:grid-cols-4 gap-4 text-center text-sm">
            <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="font-bold text-2xl text-green-600 dark:text-green-400 mb-1">2-8x</div>
              <div className="text-gray-500 dark:text-gray-400">{t('stats.upscalingOptions')}</div>
            </div>
            <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="font-bold text-2xl text-blue-600 dark:text-blue-400 mb-1">10-20s</div>
              <div className="text-gray-500 dark:text-gray-400">{t('stats.averageProcessing')}</div>
            </div>
            <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="font-bold text-2xl text-purple-600 dark:text-purple-400 mb-1">10M+</div>
              <div className="text-gray-500 dark:text-gray-400">{t('stats.imagesEnhanced')}</div>
            </div>
            <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="font-bold text-2xl text-yellow-600 dark:text-yellow-400 mb-1">4.9/5</div>
              <div className="text-gray-500 dark:text-gray-400">{t('stats.userRating')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
