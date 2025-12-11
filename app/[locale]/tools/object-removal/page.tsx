'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';

// Lazy load heavy component
const ObjectRemover = dynamic(
  () => import('@/components/ObjectRemover'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function ObjectRemovalPage() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);
  const t = useTranslations('objectRemovalPage');

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
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-100/50 dark:from-orange-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-600/20 border border-orange-300 dark:border-orange-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-orange-600 dark:text-orange-300">{t('badge')}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto mb-8">
              {t('subtitle')}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{t('stats.precision')}</div>
                <div className="text-sm text-gray-500">{t('stats.precisionLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{t('stats.processing')}</div>
                <div className="text-sm text-gray-500">{t('stats.processingLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{t('stats.creditCost')}</div>
                <div className="text-sm text-gray-500">{t('stats.creditCostLabel')}</div>
              </div>
            </div>

            {credits !== undefined && session && (
              <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-800 rounded-full px-4 py-2">
                <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-orange-700 dark:text-orange-200">
                  {t('creditsRemaining', { credits })}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Tool Section */}
        <section className="px-6 mb-12">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <ObjectRemover />
            <p className="text-sm text-gray-500 mt-4 text-center">
              {t('termsNotice')}
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-orange-100/50 dark:from-orange-900/20 to-red-100/50 dark:to-red-900/20 rounded-xl border border-orange-300 dark:border-orange-700/30 p-6">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.preciseRemoval.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('features.preciseRemoval.description')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-100/50 dark:from-red-900/20 to-orange-100/50 dark:to-orange-900/20 rounded-xl border border-red-300 dark:border-red-700/30 p-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🖼️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.naturalInfill.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('features.naturalInfill.description')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-100/50 dark:from-orange-900/20 to-red-100/50 dark:to-red-900/20 rounded-xl border border-orange-300 dark:border-orange-700/30 p-6">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.quickResults.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('features.quickResults.description')}
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 mb-16">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-8 text-center">{t('howItWorks.title')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-4 border border-orange-300 dark:border-orange-500/30">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-2xl">1</span>
                </div>
                <h3 className="font-semibold mb-2">{t('howItWorks.step1.title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('howItWorks.step1.description')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4 border border-red-300 dark:border-red-500/30">
                  <span className="text-red-600 dark:text-red-400 font-bold text-2xl">2</span>
                </div>
                <h3 className="font-semibold mb-2">{t('howItWorks.step2.title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('howItWorks.step2.description')}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-4 border border-orange-300 dark:border-orange-500/30">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-2xl">3</span>
                </div>
                <h3 className="font-semibold mb-2">{t('howItWorks.step3.title')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('howItWorks.step3.description')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="px-6 mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">{t('useCases.title')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-orange-500/50 transition">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="text-lg font-semibold mb-2">{t('useCases.people.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('useCases.people.description')}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-orange-500/50 transition">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="text-lg font-semibold mb-2">{t('useCases.text.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('useCases.text.description')}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-orange-500/50 transition">
              <div className="text-3xl mb-3">🗑️</div>
              <h3 className="text-lg font-semibold mb-2">{t('useCases.distractions.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('useCases.distractions.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="px-6 mb-16">
          <div className="bg-gray-100 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-6">{t('tips.title')}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-3">{t('tips.bestPractices.title')}</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    {t('tips.bestPractices.tip1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    {t('tips.bestPractices.tip2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    {t('tips.bestPractices.tip3')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 dark:text-green-400 mt-0.5">✓</span>
                    {t('tips.bestPractices.tip4')}
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3">{t('tips.proTips.title')}</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">★</span>
                    {t('tips.proTips.tip1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">★</span>
                    {t('tips.proTips.tip2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">★</span>
                    {t('tips.proTips.tip3')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">★</span>
                    {t('tips.proTips.tip4')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-12">
          <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl border border-orange-300 dark:border-orange-700/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('cta.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/pricing"
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-lg font-semibold text-white transition"
              >
                {t('cta.getCredits')}
              </Link>
              <Link
                href="/tools"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition"
              >
                {t('cta.exploreTools')}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ToolsLayout>
  );
}
