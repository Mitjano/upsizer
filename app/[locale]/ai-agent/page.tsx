'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useRef, useCallback, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { formatCreditCost } from '@/lib/credits-config';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';

// Lazy load heavy components
const AgentChat = dynamic(
  () => import('@/components/ai-agent/AgentChat'),
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
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-white">
        {value.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-400 text-sm mt-1">{label}</div>
    </div>
  );
}

// Tool category icons
const categoryIcons: Record<string, string> = {
  image_editing: '✂️',
  image_generation: '🎨',
  image_analysis: '🔍',
  text_processing: '📝',
  file_management: '📁',
  web_research: '🌐',
  social_media: '📱',
  translation: '🌍',
  utility: '⚙️',
};

// Static list of tools for display (to avoid importing server-side code)
interface ToolDisplay {
  name: string;
  category: string;
  creditsRequired: number;
}

const toolsList: ToolDisplay[] = [
  // Image Editing
  { name: 'remove_background', category: 'image_editing', creditsRequired: 1 },
  { name: 'upscale_image', category: 'image_editing', creditsRequired: 2 },
  { name: 'compress_image', category: 'image_editing', creditsRequired: 0 },
  { name: 'convert_format', category: 'image_editing', creditsRequired: 0 },
  { name: 'resize_image', category: 'image_editing', creditsRequired: 0 },
  { name: 'crop_image', category: 'image_editing', creditsRequired: 0 },
  { name: 'rotate_flip_image', category: 'image_editing', creditsRequired: 0 },
  { name: 'add_watermark', category: 'image_editing', creditsRequired: 0 },
  { name: 'adjust_colors', category: 'image_editing', creditsRequired: 0 },
  { name: 'apply_filter', category: 'image_editing', creditsRequired: 0 },
  // Image Generation
  { name: 'generate_image', category: 'image_generation', creditsRequired: 3 },
  { name: 'edit_image_ai', category: 'image_generation', creditsRequired: 2 },
  { name: 'extend_image', category: 'image_generation', creditsRequired: 2 },
  { name: 'create_variation', category: 'image_generation', creditsRequired: 2 },
  { name: 'image_to_image', category: 'image_generation', creditsRequired: 2 },
  // Image Analysis
  { name: 'analyze_image', category: 'image_analysis', creditsRequired: 1 },
  { name: 'extract_text', category: 'image_analysis', creditsRequired: 1 },
  { name: 'detect_faces', category: 'image_analysis', creditsRequired: 1 },
  { name: 'get_metadata', category: 'image_analysis', creditsRequired: 0 },
  // Text Processing
  { name: 'translate_text', category: 'translation', creditsRequired: 0 },
  { name: 'generate_caption', category: 'text_processing', creditsRequired: 1 },
  { name: 'rewrite_text', category: 'text_processing', creditsRequired: 0 },
  // File Management
  { name: 'create_zip', category: 'file_management', creditsRequired: 0 },
  { name: 'batch_process', category: 'file_management', creditsRequired: 0 },
  // Social Media
  { name: 'resize_for_social', category: 'social_media', creditsRequired: 0 },
  { name: 'generate_social_pack', category: 'social_media', creditsRequired: 2 },
  // Utility
  { name: 'get_credits', category: 'utility', creditsRequired: 0 },
  { name: 'get_session_history', category: 'utility', creditsRequired: 0 },
];

export default function AIAgentPage() {
  const t = useTranslations('aiAgentPage');
  const locale = useLocale();
  const { data: session } = useSession();
  const chatRef = useRef<HTMLDivElement>(null);

  // Build tools by category from static list
  const toolsByCategory = toolsList.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, ToolDisplay[]>);

  const categories = Object.keys(toolsByCategory);
  const totalTools = toolsList.length;

  // Function to scroll to chat - scroll to top of page first, then to chat
  const scrollToChat = useCallback(() => {
    // Scroll to top of page first for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        scrollToChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollToChat]);

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
                onClick={scrollToChat}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl font-semibold text-lg transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
              >
                <span>Start Chatting</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <a
                href="#tools"
                className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2"
              >
                <span>Explore Tools</span>
                <span>→</span>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <AnimatedStat value={totalTools} label={t('stats.tools')} suffix="+" />
              <AnimatedStat value={categories.length} label={t('stats.categories')} />
              <AnimatedStat value={1000} label={t('stats.operations')} suffix="+" />
            </div>
          </div>
        </div>
      </section>

      {/* Chat Section - Full width for maximum usability */}
      <section ref={chatRef} className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="min-h-[70vh]">
          <AgentChat />
        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-white">{t('tools.title')}</span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{t('tools.titleHighlight')}</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('tools.subtitle')}
          </p>
        </div>

        {/* Tools by Category */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            // Try to get translated category name, fallback to formatted key
            let categoryName: string;
            try {
              categoryName = t(`tools.categories.${category}`);
              if (categoryName.includes('tools.categories.')) {
                categoryName = category.replace(/_/g, ' ');
              }
            } catch {
              categoryName = category.replace(/_/g, ' ');
            }

            return (
              <div
                key={category}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{categoryIcons[category] || '🔧'}</span>
                  <div>
                    <h3 className="font-semibold text-white">
                      {categoryName}
                    </h3>
                    <span className="text-sm text-gray-400">
                      {toolsByCategory[category].length} {t('stats.tools').toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {toolsByCategory[category].slice(0, 4).map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-300">{tool.name.replace(/_/g, ' ')}</span>
                      <span className="text-cyan-400">{formatCreditCost(tool.creditsRequired, locale)}</span>
                    </div>
                  ))}
                  {toolsByCategory[category].length > 4 && (
                    <div className="text-sm text-gray-500">
                      +{toolsByCategory[category].length - 4} więcej...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
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
              {
                icon: '💬',
                titleKey: 'features.natural.title',
                descKey: 'features.natural.description',
                gradient: 'from-cyan-500/20 to-blue-500/20',
              },
              {
                icon: '🔗',
                titleKey: 'features.multiTool.title',
                descKey: 'features.multiTool.description',
                gradient: 'from-purple-500/20 to-pink-500/20',
              },
              {
                icon: '🧠',
                titleKey: 'features.context.title',
                descKey: 'features.context.description',
                gradient: 'from-green-500/20 to-emerald-500/20',
              },
              {
                icon: '⚡',
                titleKey: 'features.realtime.title',
                descKey: 'features.realtime.description',
                gradient: 'from-yellow-500/20 to-orange-500/20',
              },
              {
                icon: '💰',
                titleKey: 'features.credits.title',
                descKey: 'features.credits.description',
                gradient: 'from-indigo-500/20 to-purple-500/20',
              },
              {
                icon: '📚',
                titleKey: 'features.history.title',
                descKey: 'features.history.description',
                gradient: 'from-pink-500/20 to-rose-500/20',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition`}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{t(feature.titleKey)}</h3>
                <p className="text-gray-400">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('capabilities.title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/30 transition"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {t(`capabilities.items.${idx}.title`)}
              </h3>
              <p className="text-gray-400 text-sm">
                {t(`capabilities.items.${idx}.description`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Examples Section */}
      <section className="bg-gradient-to-b from-gray-900/50 to-transparent border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {t('workflows.title')}
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t('workflows.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 hover:border-cyan-500/30 transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {t(`workflows.items.${idx}.title`)}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {t(`workflows.items.${idx}.description`)}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full whitespace-nowrap">
                    {t(`workflows.items.${idx}.credits`)}
                  </span>
                </div>

                {/* Example prompt */}
                <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-300 italic">
                    &ldquo;{t(`workflows.items.${idx}.prompt`)}&rdquo;
                  </p>
                </div>

                {/* Steps visualization */}
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4].map((stepIdx) => {
                    try {
                      const step = t(`workflows.items.${idx}.steps.${stepIdx}`);
                      if (!step || step.includes('workflows.items')) return null;
                      return (
                        <span
                          key={stepIdx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded text-xs text-gray-300"
                        >
                          <span className="w-4 h-4 bg-cyan-500/30 text-cyan-400 rounded-full text-[10px] flex items-center justify-center">
                            {stepIdx + 1}
                          </span>
                          {step}
                        </span>
                      );
                    } catch {
                      return null;
                    }
                  })}
                </div>

                {/* Try this button */}
                <button
                  onClick={() => {
                    scrollToChat();
                  }}
                  className="mt-4 w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg text-sm font-medium transition"
                >
                  {t('workflows.tryButton')} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('useCases.title')}
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('useCases.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/30 transition group"
            >
              <div className="text-4xl mb-4">{t(`useCases.items.${idx}.icon`)}</div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {t(`useCases.items.${idx}.title`)}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {t(`useCases.items.${idx}.description`)}
              </p>
              <div className="bg-gray-900/50 rounded-lg p-3">
                <p className="text-xs text-cyan-400 italic">
                  {t(`useCases.items.${idx}.example`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pro Tips Section */}
      <section className="bg-gray-900/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {t('tips.title')}
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              {t('tips.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 bg-gray-800/30 rounded-xl p-4 border border-gray-700/50"
              >
                <div className="text-2xl">{t(`tips.items.${idx}.icon`)}</div>
                <div>
                  <h4 className="font-medium text-white mb-1">
                    {t(`tips.items.${idx}.title`)}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {t(`tips.items.${idx}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
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

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {session ? (
              <button
                onClick={scrollToChat}
                className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-lg transition"
              >
                Start Creating
              </button>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold text-lg transition"
                >
                  {t('pricing.startFree')}
                </Link>
                <Link
                  href="/pricing"
                  className="px-8 py-4 bg-transparent border border-white/30 hover:bg-white/10 rounded-xl font-semibold text-lg transition"
                >
                  {t('pricing.viewPricing')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('cta.title')}
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            {t('cta.subtitle')}
          </p>
          <button
            onClick={scrollToChat}
            className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl font-semibold text-lg transition shadow-lg shadow-cyan-500/25"
          >
            {t('cta.button')}
          </button>
        </div>
      </section>
    </ToolsLayout>
  );
}
