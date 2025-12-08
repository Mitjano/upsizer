'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';

// Lazy load the generator component
const AIMusicGenerator = dynamic(
  () => import('@/components/ai-music/AIMusicGenerator'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    ),
    ssr: false,
  }
);

// Stats component
function AnimatedStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
    </div>
  );
}

export default function AIMusicPage() {
  const t = useTranslations('aiMusic');
  const { data: session } = useSession();
  const generatorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'library' | 'explore'>('generate');

  // Function to scroll to generator
  const scrollToGenerator = useCallback(() => {
    generatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        scrollToGenerator();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollToGenerator]);

  return (
    <ToolsLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-purple-300">AI Music Studio</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">{t('heading').split(' ').slice(0, -1).join(' ')} </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                {t('heading').split(' ').slice(-1)[0]}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('subheading')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={scrollToGenerator}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-semibold text-lg transition shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                <span>{t('generate')}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </button>
              <Link
                href="/ai-music/library"
                className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2"
              >
                <span>{t('tabs.library')}</span>
                <span>→</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <AnimatedStat value={5} label={t('durations.300')} suffix="" />
              <AnimatedStat value={14} label={t('generator.styleLabel')} suffix="+" />
              <AnimatedStat value={3} label={t('mastering.title')} suffix="" />
            </div>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section ref={generatorRef} className="max-w-7xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden mb-8">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'generate'
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('tabs.generate')}
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'library'
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {t('tabs.library')}
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex-1 py-4 px-6 text-sm font-medium transition flex items-center justify-center gap-2 ${
                activeTab === 'explore'
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {t('tabs.explore')}
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'generate' && <AIMusicGenerator />}
            {activeTab === 'library' && (
              session ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🎵</div>
                  <h3 className="text-xl font-semibold mb-2">{t('library.title')}</h3>
                  <p className="text-gray-400 mb-6">{t('library.emptyLibraryHint')}</p>
                  <Link
                    href="/ai-music/library"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
                  >
                    {t('library.title')}
                  </Link>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔒</div>
                  <h3 className="text-xl font-semibold mb-2">Sign in Required</h3>
                  <p className="text-gray-400 mb-6">Please sign in to view your music library</p>
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
                  >
                    Sign In
                  </Link>
                </div>
              )
            )}
            {activeTab === 'explore' && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold mb-2">{t('explore.title')}</h3>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-white">Powerful </span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Features</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '🎤', key: 'vocals', gradient: 'from-purple-500/20 to-pink-500/20' },
            { icon: '⏱️', key: 'duration', gradient: 'from-blue-500/20 to-cyan-500/20' },
            { icon: '🎚️', key: 'mastering', gradient: 'from-green-500/20 to-emerald-500/20' },
            { icon: '🎨', key: 'styles', gradient: 'from-orange-500/20 to-red-500/20' },
          ].map((feature) => (
            <div
              key={feature.key}
              className={`bg-gradient-to-br ${feature.gradient} border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t(`features.${feature.key}.title`)}
              </h3>
              <p className="text-gray-400 text-sm">
                {t(`features.${feature.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mastering Section */}
      <section className="bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">{t('mastering.title')}</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t('mastering.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(['lo', 'med', 'hi'] as const).map((intensity) => (
              <div
                key={intensity}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition"
              >
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    intensity === 'lo' ? 'bg-blue-500/20' :
                    intensity === 'med' ? 'bg-purple-500/20' :
                    'bg-red-500/20'
                  }`}>
                    <span className="text-3xl">
                      {intensity === 'lo' ? '🔈' : intensity === 'med' ? '🔊' : '📢'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {t(`mastering.${intensity}`)}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {t(`mastering.${intensity}Desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Create Music?
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Start generating professional quality songs with AI. Credits-based pricing with no subscriptions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {session ? (
              <button
                onClick={scrollToGenerator}
                className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-lg transition"
              >
                {t('generate')}
              </button>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-lg transition"
                >
                  Get Started
                </Link>
                <Link
                  href="/pricing"
                  className="px-8 py-4 bg-transparent border border-white/30 hover:bg-white/10 rounded-xl font-semibold text-lg transition"
                >
                  View Pricing
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            <span>From <strong className="text-white">8</strong> {t('credits')} per song</span>
            <span>•</span>
            <span>Up to <strong className="text-white">5 min</strong> duration</span>
            <span>•</span>
            <span><strong className="text-white">Free</strong> mastering available</span>
          </div>
        </div>
      </section>
    </ToolsLayout>
  );
}
