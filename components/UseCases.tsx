"use client";

import { useState } from "react";
import { useTranslations } from 'next-intl';

const useCaseIds = ['individuals', 'professionals', 'ecommerce'] as const;
const useCaseIcons: Record<string, string> = {
  individuals: '👤',
  professionals: '💼',
  ecommerce: '🛒'
};

export default function UseCases() {
  const t = useTranslations('useCases');
  const [activeTab, setActiveTab] = useState<string>("individuals");

  return (
    <section id="use-cases" className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          {t('title')} <span className="text-green-600 dark:text-green-400">{t('titleHighlight')}</span>
        </h2>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center gap-4 mb-12 flex-wrap">
        {useCaseIds.map((id) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === id
                ? "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg"
                : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <span className="mr-2">{useCaseIcons[id]}</span>
            {t(`cases.${id}.title`)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 md:p-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Benefits */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <span className="text-4xl">{useCaseIcons[activeTab]}</span>
              {t(`cases.${activeTab}.title`)}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">
              {t(`cases.${activeTab}.description`)}
            </p>

            <h4 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">{t('keyBenefits')}</h4>
            <ul className="space-y-3">
              {[1, 2, 3, 4, 5].map((index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
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
                  <span className="text-gray-600 dark:text-gray-300">{t(`cases.${activeTab}.benefits.b${index}`)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column - Examples */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">{t('perfectFor')}</h4>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <p className="font-medium">{t(`cases.${activeTab}.examples.e${index}`)}</p>
                </div>
              ))}
            </div>

            {/* CTA Box */}
            <div className="mt-8 bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/50 rounded-xl p-6">
              <h5 className="font-bold text-lg mb-2">{t('cta.title')}</h5>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                {t('cta.subtitle')}
              </p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
              >
                {t('cta.button')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid md:grid-cols-4 gap-6 mt-12">
        <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">10M+</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('stats.imagesEnhanced')}</div>
        </div>
        <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">500K+</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('stats.happyUsers')}</div>
        </div>
        <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">4.9/5</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('stats.averageRating')}</div>
        </div>
        <div className="bg-gray-100/30 dark:bg-gray-800/30 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">8x</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('stats.maxUpscaling')}</div>
        </div>
      </div>
    </section>
  );
}
