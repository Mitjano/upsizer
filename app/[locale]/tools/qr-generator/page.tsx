'use client';

import dynamic from 'next/dynamic';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const QRGenerator = dynamic(
  () => import('@/components/QRGenerator'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function QRGeneratorPage() {
  const t = useTranslations('tools.qrGenerator');

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-100/50 dark:from-gray-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gray-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-slate-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-600/20 border border-gray-300 dark:border-gray-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500"></span>
              </span>
              <span className="text-gray-600 dark:text-gray-300">FREE Tool</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-600 via-slate-500 to-gray-700 bg-clip-text text-transparent">
                {t('name')}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto mb-8">
              {t('description')}
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">FREE</div>
                <div className="text-sm text-gray-500">No credits needed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">Custom</div>
                <div className="text-sm text-gray-500">Colors & logos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">Instant</div>
                <div className="text-sm text-gray-500">Generation</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool Section */}
        <section className="px-6 mb-12">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <QRGenerator />
          </div>
        </section>

        {/* Features */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-100 dark:from-gray-900/20 to-slate-100 dark:to-slate-900/20 rounded-xl border border-gray-200 dark:border-gray-700/30 p-6">
              <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Custom Colors</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose custom dark and light colors for your QR code design.
              </p>
            </div>
            <div className="bg-gradient-to-br from-slate-100 dark:from-slate-900/20 to-gray-100 dark:to-gray-900/20 rounded-xl border border-gray-200 dark:border-slate-700/30 p-6">
              <div className="w-12 h-12 bg-slate-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🖼️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Logo Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add your own logo to the center of the QR code for branding.
              </p>
            </div>
            <div className="bg-gradient-to-br from-gray-100 dark:from-gray-900/20 to-slate-100 dark:to-slate-900/20 rounded-xl border border-gray-200 dark:border-gray-700/30 p-6">
              <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📏</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Configurable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adjust size, error correction level, and margin for your needs.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-12">
          <div className="bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30 rounded-2xl border border-gray-300 dark:border-gray-700/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Explore More Free Tools</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Try our other free image editing tools - crop, resize, filters, and more.
            </p>
            <Link
              href="/tools"
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white rounded-lg font-semibold transition inline-block"
            >
              View All Tools
            </Link>
          </div>
        </section>
      </div>
    </ToolsLayout>
  );
}
