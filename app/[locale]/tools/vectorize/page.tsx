'use client';

import dynamic from 'next/dynamic';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const Vectorize = dynamic(
  () => import('@/components/Vectorize'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function VectorizePage() {
  const t = useTranslations('tools.vectorize');

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-teal-100/50 dark:from-teal-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 dark:bg-teal-600/20 border border-teal-300 dark:border-teal-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-teal-600 dark:text-teal-300">AI-Powered</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
                {t('name')}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto mb-8">
              {t('description')}
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">3 Credits</div>
                <div className="text-sm text-gray-500">Per conversion</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">3 Modes</div>
                <div className="text-sm text-gray-500">Color options</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">SVG</div>
                <div className="text-sm text-gray-500">Vector output</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool Section */}
        <section className="px-6 mb-12">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <Vectorize />
          </div>
        </section>

        {/* Features */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-teal-100 dark:from-teal-900/20 to-cyan-100 dark:to-cyan-900/20 rounded-xl border border-gray-200 dark:border-teal-700/30 p-6">
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Color Modes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Full color, grayscale, or black & white vectorization options.
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-100 dark:from-cyan-900/20 to-teal-100 dark:to-teal-900/20 rounded-xl border border-gray-200 dark:border-cyan-700/30 p-6">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔢</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Max Colors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control the color palette size from unlimited to 256 colors.
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-100 dark:from-teal-900/20 to-cyan-100 dark:to-cyan-900/20 rounded-xl border border-gray-200 dark:border-teal-700/30 p-6">
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📐</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Scalable Output</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SVG vector files scale infinitely without quality loss.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-12">
          <div className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-2xl border border-teal-300 dark:border-teal-700/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Explore More AI Tools</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Try our other AI-powered tools - background removal, upscaling, logo maker, and more.
            </p>
            <Link
              href="/tools"
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition inline-block"
            >
              View All Tools
            </Link>
          </div>
        </section>
      </div>
    </ToolsLayout>
  );
}
