'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const CropImage = dynamic(
  () => import('@/components/CropImage'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function CropImagePage() {
  const { data: session } = useSession();
  const t = useTranslations('tools.cropImage');

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-green-100/50 dark:from-green-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-600/20 border border-green-300 dark:border-green-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-green-600 dark:text-green-300">FREE Tool</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
                {t('name')}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto mb-8">
              {t('description')}
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">FREE</div>
                <div className="text-sm text-gray-500">No credits needed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Instant</div>
                <div className="text-sm text-gray-500">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">8+ Ratios</div>
                <div className="text-sm text-gray-500">Preset options</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool Section */}
        <section className="px-6 mb-12">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <CropImage />
          </div>
        </section>

        {/* Features */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-100 dark:from-green-900/20 to-emerald-100 dark:to-emerald-900/20 rounded-xl border border-gray-200 dark:border-green-700/30 p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✂️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Preset Aspect Ratios</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose from popular aspect ratios like 1:1, 4:3, 16:9, or crop freely.
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-100 dark:from-emerald-900/20 to-green-100 dark:to-green-900/20 rounded-xl border border-gray-200 dark:border-emerald-700/30 p-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📐</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Precise Control</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter exact pixel values for X, Y, width and height for precise cropping.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-100 dark:from-green-900/20 to-emerald-100 dark:to-emerald-900/20 rounded-xl border border-gray-200 dark:border-green-700/30 p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Processing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Client-side preview with server-side processing for best quality output.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-12">
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl border border-green-300 dark:border-green-700/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Explore More Free Tools</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Try our other free image editing tools - resize, filters, collage maker, and more.
            </p>
            <Link
              href="/tools"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition inline-block"
            >
              View All Tools
            </Link>
          </div>
        </section>
      </div>
    </ToolsLayout>
  );
}
