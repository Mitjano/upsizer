'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';

// Lazy load the library component
const AIMusicLibrary = dynamic(
  () => import('@/components/ai-music/AIMusicLibrary'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function AIMusicLibraryPage() {
  const t = useTranslations('aiMusic');

  return (
    <ToolsLayout>
      {/* Header */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-60 h-60 bg-pink-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link href="/ai-music" className="hover:text-white transition">
              AI Music
            </Link>
            <span>/</span>
            <span className="text-white">{t('library.title')}</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {t('library.title')}
              </h1>
              <p className="text-gray-400">
                Manage your AI-generated music tracks and playlists
              </p>
            </div>

            <Link
              href="/ai-music"
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-medium transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('tabs.generate')}
            </Link>
          </div>
        </div>
      </section>

      {/* Library Content */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <AIMusicLibrary />
      </section>
    </ToolsLayout>
  );
}
