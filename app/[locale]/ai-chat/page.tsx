'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FaRobot, FaComments, FaCoins, FaImage, FaHistory, FaShare, FaCheck, FaQuestionCircle } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi2';

// Lazy load ChatWindow (heavy component)
const ChatWindow = dynamic(
  () => import('@/components/ai-chat/ChatWindow'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-gray-400">Loading AI Chat...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Feature cards data
const FEATURES = [
  {
    id: 'free',
    icon: <HiSparkles className="w-6 h-6" />,
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: 'models',
    icon: <FaRobot className="w-6 h-6" />,
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    id: 'payPerUse',
    icon: <FaCoins className="w-6 h-6" />,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'multimodal',
    icon: <FaImage className="w-6 h-6" />,
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'history',
    icon: <FaHistory className="w-6 h-6" />,
    gradient: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'export',
    icon: <FaShare className="w-6 h-6" />,
    gradient: 'from-pink-500 to-rose-600',
  },
];

// AI Models data
const AI_MODELS = [
  { name: 'GPT-5.2', provider: 'OpenAI', tier: 'pro', isNew: true },
  { name: 'Claude Opus 4.5', provider: 'Anthropic', tier: 'premium', isNew: true },
  { name: 'Gemini 2.5 Pro', provider: 'Google', tier: 'pro', isNew: false },
  { name: 'Gemini Flash-Lite', provider: 'Google', tier: 'free', isNew: false },
  { name: 'Llama 3.3 8B', provider: 'Meta', tier: 'free', isNew: false },
  { name: 'DeepSeek V3', provider: 'DeepSeek', tier: 'free', isNew: false },
  { name: 'DeepSeek R1', provider: 'DeepSeek', tier: 'reasoning', isNew: true },
  { name: 'Grok 4', provider: 'xAI', tier: 'premium', isNew: true },
  { name: 'Mistral Large', provider: 'Mistral', tier: 'pro', isNew: false },
  { name: 'Qwen 2.5 72B', provider: 'Alibaba', tier: 'free', isNew: false },
];

export default function AIChatPage() {
  const t = useTranslations('chat');
  const tLanding = useTranslations('chatLanding');
  const { data: session, status } = useSession();

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent dark:from-purple-900/20" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-purple-100 dark:from-purple-600/20 dark:to-green-600/20 border border-green-300 dark:border-purple-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-green-700 dark:text-purple-300 font-medium">{tLanding('hero.badge')}</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6">
              <span className="text-gray-900 dark:text-white">{tLanding('hero.titlePart1')} </span>
              <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                {tLanding('hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-10 leading-relaxed">
              {tLanding('hero.description')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/auth/signin"
                className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40 hover:-translate-y-0.5 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <HiSparkles className="w-5 h-5" />
                  {tLanding('hero.cta')}
                </span>
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl border border-gray-300 dark:border-gray-700 transition shadow-sm"
              >
                {tLanding('hero.ctaSecondary')}
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">20+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{tLanding('stats.models')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-500">4</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{tLanding('stats.freeModels')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">1M+</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{tLanding('stats.contextTokens')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-500">$0</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{tLanding('stats.subscription')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              <span className="text-gray-900 dark:text-white">{tLanding('features.title')} </span>
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                {tLanding('features.titleHighlight')}
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              {tLanding('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.id}
                className="group relative bg-white dark:bg-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 hover:border-purple-300 dark:hover:border-gray-600 rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-lg mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t(`features.${feature.id}.title`)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t(`features.${feature.id}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Models Section */}
        <section className="bg-gray-50 dark:bg-gray-800/30 py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900 dark:text-white">
                {tLanding('models.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                {tLanding('models.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {AI_MODELS.map((model, idx) => (
                <div
                  key={idx}
                  className="relative bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-4 text-center hover:border-purple-300 dark:hover:border-gray-600 transition shadow-sm hover:shadow-md"
                >
                  {model.isNew && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white shadow-lg">
                      NEW
                    </span>
                  )}
                  <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">{model.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{model.provider}</div>
                  <span
                    className={`
                      text-[10px] px-2 py-0.5 rounded-full font-medium
                      ${model.tier === 'free' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : ''}
                      ${model.tier === 'pro' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : ''}
                      ${model.tier === 'premium' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : ''}
                      ${model.tier === 'reasoning' ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400' : ''}
                    `}
                  >
                    {tLanding(`models.tiers.${model.tier}`)}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {tLanding('models.more')}
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900 dark:text-white">
              {tLanding('useCases.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              {tLanding('useCases.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {['coding', 'writing', 'research', 'learning'].map((useCase) => (
              <div key={useCase} className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm">
                <div className="text-3xl mb-4">{tLanding(`useCases.${useCase}.icon`)}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {tLanding(`useCases.${useCase}.title`)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tLanding(`useCases.${useCase}.description`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Section */}
        <section className="bg-gray-50 dark:bg-gray-800/30 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900 dark:text-white">
                {tLanding('comparison.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {tLanding('comparison.subtitle')}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-lg overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 sm:px-6 py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{tLanding('comparison.feature')}</th>
                    <th className="px-3 sm:px-6 py-4 text-center text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400">Pixelift</th>
                    <th className="px-3 sm:px-6 py-4 text-center text-xs sm:text-sm font-semibold text-gray-500">{tLanding('comparison.others')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {['freeModels', 'noSubscription', 'multipleProviders', 'contextLength', 'fileUploads'].map((feature) => (
                    <tr key={feature}>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300">{tLanding(`comparison.features.${feature}`)}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <FaCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-gray-400">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900 dark:text-white">
              {tLanding('faq.title')}
            </h2>
          </div>

          <div className="space-y-4">
            {['q1', 'q2', 'q3', 'q4', 'q5'].map((q) => (
              <details key={q} className="group bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/50 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer">
                  <span className="font-medium text-gray-900 dark:text-white">{tLanding(`faq.${q}.question`)}</span>
                  <FaQuestionCircle className="w-5 h-5 text-purple-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                  {tLanding(`faq.${q}.answer`)}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="relative bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 border border-purple-200 dark:border-purple-500/20 rounded-3xl p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <FaComments className="w-16 h-16 mx-auto mb-6 text-purple-500 dark:text-purple-400" />
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                {tLanding('cta.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto text-lg">
                {tLanding('cta.description')}
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transition-all hover:scale-105"
              >
                <HiSparkles className="w-5 h-5" />
                {tLanding('cta.button')}
              </Link>
            </div>
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="max-w-4xl mx-auto px-6 pb-20">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{tLanding('seoContent.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{tLanding('seoContent.p1')}</p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{tLanding('seoContent.p2')}</p>
            <p className="text-gray-600 dark:text-gray-400">{tLanding('seoContent.p3')}</p>
          </div>
        </section>
      </div>
    );
  }

  // Authenticated - show chat interface (fullscreen, no header/footer)
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-40">
      <ChatWindow />
    </div>
  );
}
