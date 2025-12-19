'use client';

import dynamic from 'next/dynamic';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const LogoMaker = dynamic(
  () => import('@/components/LogoMaker'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function LogoMakerPage() {
  const t = useTranslations('tools.logoMaker');

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-100/50 dark:from-indigo-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-300 dark:border-indigo-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="text-indigo-600 dark:text-indigo-300">AI-Powered</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-500 bg-clip-text text-transparent">
                {t('name')}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto mb-8">
              {t('description')}
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">5 Credits</div>
                <div className="text-sm text-gray-500">Per generation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">6 Styles</div>
                <div className="text-sm text-gray-500">To choose from</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">AI</div>
                <div className="text-sm text-gray-500">Ideogram V2</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool Section */}
        <section className="px-6 mb-12">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <LogoMaker />
          </div>
        </section>

        {/* Features */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-100 dark:from-indigo-900/20 to-violet-100 dark:to-violet-900/20 rounded-xl border border-gray-200 dark:border-indigo-700/30 p-6">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Multiple Styles</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Minimalist, vintage, modern, playful, professional, and tech styles.
              </p>
            </div>
            <div className="bg-gradient-to-br from-violet-100 dark:from-violet-900/20 to-indigo-100 dark:to-indigo-900/20 rounded-xl border border-gray-200 dark:border-violet-700/30 p-6">
              <div className="w-12 h-12 bg-violet-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Generated</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by Ideogram V2 Turbo for professional quality logos.
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-100 dark:from-indigo-900/20 to-violet-100 dark:to-violet-900/20 rounded-xl border border-gray-200 dark:border-indigo-700/30 p-6">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Custom Colors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Optional color scheme input to match your brand identity.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-12">
          <div className="bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30 rounded-2xl border border-indigo-300 dark:border-indigo-700/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Explore More AI Tools</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Try our other AI-powered tools - background removal, upscaling, text effects, and more.
            </p>
            <Link
              href="/tools"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-lg font-semibold transition inline-block"
            >
              View All Tools
            </Link>
          </div>
        </section>
      </div>
    </ToolsLayout>
  );
}
