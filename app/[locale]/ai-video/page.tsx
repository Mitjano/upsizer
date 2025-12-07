'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';
import { VIDEO_MODELS, getActiveModels, type VideoModelId, type Duration } from '@/lib/ai-video/models';
import { getToolCost, type ToolType } from '@/lib/credits-config';

// Lazy load heavy components
const AIVideoGenerator = dynamic(
  () => import('@/components/AIVideoGenerator'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
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

// Model info with translated content
const MODEL_INFO: Record<string, { key: string; gradient: string; icon: string }> = {
  'pixverse-v5': { key: 'pixverse', gradient: 'from-blue-500 to-cyan-500', icon: '🚀' },
  'kling-2.5': { key: 'kling', gradient: 'from-green-500 to-emerald-500', icon: '⚡' },
  'veo-3.1': { key: 'veo', gradient: 'from-purple-500 to-pink-500', icon: '👑' },
  'runway-gen4': { key: 'runway', gradient: 'from-orange-500 to-red-500', icon: '🎬' },
};

export default function AIVideoPage() {
  const t = useTranslations('aiVideoPage');
  const { data: session } = useSession();
  const generatorRef = useRef<HTMLDivElement>(null);

  const activeModels = getActiveModels();

  // Get min credit cost
  const getMinCost = (modelId: VideoModelId) => {
    const model = VIDEO_MODELS[modelId];
    const minDuration = Math.min(...model.durations) as Duration;
    const toolType = `video_${modelId.replace('-', '_').replace('.', '_')}_${minDuration}s` as ToolType;
    try {
      return getToolCost(toolType);
    } catch {
      const cost = model.costPerGeneration[minDuration];
      return cost ? Math.ceil(cost * 10) : 10;
    }
  };

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
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 rounded-full text-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-cyan-300">{t('badge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">{t('hero.title1')}</span>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
              <br />
              <span className="text-white">{t('hero.title2')}</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('hero.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={scrollToGenerator}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl font-semibold text-lg transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                <span>{t('hero.startCreating')}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <a
                href="#models"
                className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2"
              >
                <span>{t('hero.viewGallery')}</span>
                <span>→</span>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <AnimatedStat value={activeModels.length} label={t('stats.aiModels')} suffix="+" />
              <AnimatedStat value={100} label={t('stats.videosCreated')} suffix="+" />
              <AnimatedStat value={10} label={t('stats.maxDuration')} suffix="s" />
            </div>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section ref={generatorRef} className="max-w-7xl mx-auto px-6 py-12">
        <AIVideoGenerator />
      </section>

      {/* Models Showcase */}
      <section id="models" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-white">{t('models.title')}</span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{t('models.titleHighlight')}</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('models.subtitle')}
          </p>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(VIDEO_MODELS).map(([id, model]) => {
            const info = MODEL_INFO[id] || { key: 'pixverse', gradient: 'from-gray-500 to-gray-600', icon: '🎬' };
            const minCost = getMinCost(id as VideoModelId);

            return (
              <div
                key={id}
                onClick={scrollToGenerator}
                className={`bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition cursor-pointer group ${!model.isActive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.gradient} flex items-center justify-center text-2xl`}>
                      {info.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition text-lg">
                          {t(`models.${info.key}.name`)}
                        </h3>
                        {model.isPremium && (
                          <span className="px-2 py-0.5 bg-purple-600/30 text-purple-400 text-xs font-semibold rounded">
                            {t('generator.premium')}
                          </span>
                        )}
                        {!model.isActive && (
                          <span className="px-2 py-0.5 bg-gray-600/30 text-gray-400 text-xs font-semibold rounded">
                            SOON
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{model.provider}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-400 font-semibold">{minCost}+</div>
                    <div className="text-xs text-gray-500">{t('models.credits')}</div>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-4">
                  {t(`models.${info.key}.description`)}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {t(`models.${info.key}.tags`).split(', ').map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-cyan-600/20 text-cyan-400 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {model.durations.join('/')}s
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    {model.resolutions.join(', ')}
                  </span>
                  {model.supportsAudio && (
                    <span className="flex items-center gap-1 text-green-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
                      </svg>
                      {t('generator.withAudio')}
                    </span>
                  )}
                  {model.supportsImageToVideo && (
                    <span className="flex items-center gap-1 text-blue-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t('generator.supportsImage')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-white">{t('useCases.title')}</span>
              <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">{t('useCases.titleHighlight')}</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t('useCases.subtitle')}
            </p>
          </div>

          {/* Use Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { key: 'marketing', icon: '📢', color: 'from-red-500/20 to-orange-500/20' },
              { key: 'content', icon: '📱', color: 'from-purple-500/20 to-pink-500/20' },
              { key: 'education', icon: '📚', color: 'from-blue-500/20 to-cyan-500/20' },
              { key: 'entertainment', icon: '🎬', color: 'from-yellow-500/20 to-orange-500/20' },
              { key: 'business', icon: '💼', color: 'from-green-500/20 to-emerald-500/20' },
              { key: 'ecommerce', icon: '🛒', color: 'from-indigo-500/20 to-purple-500/20' },
            ].map((useCase) => (
              <div
                key={useCase.key}
                className={`bg-gradient-to-br ${useCase.color} border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition`}
              >
                <div className="text-4xl mb-4">{useCase.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t(`useCases.${useCase.key}.title`)}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {t(`useCases.${useCase.key}.description`)}
                </p>
                <div className="text-xs text-gray-500">
                  {t(`useCases.${useCase.key}.examples`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('features.title')}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '⚡', key: 'fast', gradient: 'from-yellow-500/20 to-orange-500/20' },
            { icon: '🎨', key: 'models', gradient: 'from-purple-500/20 to-pink-500/20' },
            { icon: '✨', key: 'quality', gradient: 'from-cyan-500/20 to-blue-500/20' },
            { icon: '🔊', key: 'audio', gradient: 'from-green-500/20 to-emerald-500/20' },
            { icon: '📐', key: 'aspectRatios', gradient: 'from-indigo-500/20 to-purple-500/20' },
            { icon: '🖼️', key: 'imageToVideo', gradient: 'from-pink-500/20 to-rose-500/20' },
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

      {/* Pricing Teaser */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border border-cyan-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('pricing.title')}
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            {t('pricing.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {session ? (
              <button
                onClick={scrollToGenerator}
                className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-lg transition"
              >
                {t('cta.startNow')}
              </button>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-lg transition"
                >
                  {t('pricing.getCredits')}
                </Link>
                <Link
                  href="/pricing"
                  className="px-8 py-4 bg-transparent border border-white/30 hover:bg-white/10 rounded-xl font-semibold text-lg transition"
                >
                  {t('pricing.viewPlans')}
                </Link>
              </>
            )}
          </div>

          {/* Credit info */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            <span>{t('pricing.from')} <strong className="text-white">3</strong> {t('pricing.credits')} {t('pricing.perVideo')}</span>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('faq.title')}
          </h2>
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <details
              key={num}
              className="bg-gray-800/50 border border-gray-700 rounded-xl group"
            >
              <summary className="flex items-center justify-between p-5 cursor-pointer text-white font-medium hover:text-cyan-400 transition">
                {t(`faq.q${num}`)}
                <svg
                  className="w-5 h-5 text-gray-400 group-open:rotate-180 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 text-gray-400">{t(`faq.a${num}`)}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('cta.title')}
          </h2>
          <p className="text-gray-400 text-lg mb-4">
            {t('cta.subtitle')}
          </p>
          <p className="text-cyan-400 text-sm mb-8">
            {t('cta.freeCredits')}
          </p>
          <button
            onClick={scrollToGenerator}
            className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl font-semibold text-lg transition shadow-lg shadow-cyan-500/25"
          >
            {t('cta.startNow')}
          </button>
        </div>
      </section>
    </ToolsLayout>
  );
}
