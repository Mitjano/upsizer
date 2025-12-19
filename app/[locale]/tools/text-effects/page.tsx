'use client';

import dynamic from 'next/dynamic';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const TextEffects = dynamic(
  () => import('@/components/TextEffects'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function TextEffectsPage() {
  const t = useTranslations('tools.textEffects');

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-100/50 dark:from-fuchsia-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia-100 dark:bg-fuchsia-600/20 border border-fuchsia-300 dark:border-fuchsia-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
              </span>
              <span className="text-fuchsia-600 dark:text-fuchsia-300">AI-Powered</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
                {t('name')}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto mb-8">
              {t('description')}
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">5 Credits</div>
                <div className="text-sm text-gray-500">Per generation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">10 Styles</div>
                <div className="text-sm text-gray-500">Text effects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">AI</div>
                <div className="text-sm text-gray-500">Ideogram V2</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool Section */}
        <section className="px-6 mb-12">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <TextEffects />
          </div>
        </section>

        {/* Features */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-fuchsia-100 dark:from-fuchsia-900/20 to-purple-100 dark:to-purple-900/20 rounded-xl border border-gray-200 dark:border-fuchsia-700/30 p-6">
              <div className="w-12 h-12 bg-fuchsia-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">10 Effect Styles</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                3D, neon, graffiti, fire, ice, gold, chrome, cartoon, retro, and glitch.
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 dark:from-purple-900/20 to-fuchsia-100 dark:to-fuchsia-900/20 rounded-xl border border-gray-200 dark:border-purple-700/30 p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🖼️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Background Options</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Transparent, solid color, or gradient backgrounds for your text.
              </p>
            </div>
            <div className="bg-gradient-to-br from-fuchsia-100 dark:from-fuchsia-900/20 to-purple-100 dark:to-purple-900/20 rounded-xl border border-gray-200 dark:border-fuchsia-700/30 p-6">
              <div className="w-12 h-12 bg-fuchsia-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Generated</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by Ideogram V2 for stunning, professional text effects.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-12">
          <div className="bg-gradient-to-r from-fuchsia-100 to-purple-100 dark:from-fuchsia-900/30 dark:to-purple-900/30 rounded-2xl border border-fuchsia-300 dark:border-fuchsia-700/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Explore More AI Tools</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Try our other AI-powered tools - logo maker, background removal, upscaling, and more.
            </p>
            <Link
              href="/tools"
              className="px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white rounded-lg font-semibold transition inline-block"
            >
              View All Tools
            </Link>
          </div>
        </section>
      </div>
    </ToolsLayout>
  );
}
