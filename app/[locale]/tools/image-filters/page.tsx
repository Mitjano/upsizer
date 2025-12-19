'use client';

import dynamic from 'next/dynamic';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const ImageFilters = dynamic(
  () => import('@/components/ImageFilters'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function ImageFiltersPage() {
  const t = useTranslations('tools.imageFilters');

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-100/50 dark:from-pink-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-600/20 border border-pink-300 dark:border-pink-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
              </span>
              <span className="text-pink-600 dark:text-pink-300">FREE Tool</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
                {t('name')}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto mb-8">
              {t('description')}
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">FREE</div>
                <div className="text-sm text-gray-500">No credits needed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">7 Presets</div>
                <div className="text-sm text-gray-500">Filter styles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">5 Sliders</div>
                <div className="text-sm text-gray-500">Fine control</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool Section */}
        <section className="px-6 mb-12">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <ImageFilters />
          </div>
        </section>

        {/* Features */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-pink-100 dark:from-pink-900/20 to-rose-100 dark:to-rose-900/20 rounded-xl border border-gray-200 dark:border-pink-700/30 p-6">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Filter Presets</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Grayscale, sepia, vintage, cool, warm, and dramatic presets.
              </p>
            </div>
            <div className="bg-gradient-to-br from-rose-100 dark:from-rose-900/20 to-pink-100 dark:to-pink-900/20 rounded-xl border border-gray-200 dark:border-rose-700/30 p-6">
              <div className="w-12 h-12 bg-rose-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎚️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Fine Adjustments</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control brightness, contrast, saturation, blur, and sharpness.
              </p>
            </div>
            <div className="bg-gradient-to-br from-pink-100 dark:from-pink-900/20 to-rose-100 dark:to-rose-900/20 rounded-xl border border-gray-200 dark:border-pink-700/30 p-6">
              <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">👁️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See changes in real-time before applying to your image.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-12">
          <div className="bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-2xl border border-pink-300 dark:border-pink-700/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Explore More Free Tools</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Try our other free image editing tools - crop, resize, collage maker, and more.
            </p>
            <Link
              href="/tools"
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white rounded-lg font-semibold transition inline-block"
            >
              View All Tools
            </Link>
          </div>
        </section>
      </div>
    </ToolsLayout>
  );
}
