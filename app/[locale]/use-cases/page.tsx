'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  FaCamera, FaShoppingCart, FaPrint, FaGamepad,
  FaImage, FaBuilding, FaHeart, FaFilm,
  FaArrowRight, FaCheck, FaStar, FaVideo, FaMagic, FaPlay
} from 'react-icons/fa';
import { HiSparkles, HiLightningBolt, HiPhotograph } from 'react-icons/hi';

// Use case data with enhanced info
const useCaseData = {
  ecommerce: {
    icon: FaShoppingCart,
    gradient: 'from-emerald-500 to-green-600',
    bgGradient: 'from-emerald-500/10 to-green-600/10',
    borderColor: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/60',
    tools: ['remove-background', 'packshot-generator', 'upscaler'],
    stat: '85%',
    statLabel: 'conversion boost',
  },
  photography: {
    icon: FaCamera,
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-500/10 to-purple-600/10',
    borderColor: 'border-violet-500/30',
    hoverBorder: 'hover:border-violet-500/60',
    tools: ['upscaler', 'restore', 'colorize'],
    stat: '4x',
    statLabel: 'resolution',
  },
  realEstate: {
    icon: FaBuilding,
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-500/10 to-orange-600/10',
    borderColor: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/60',
    tools: ['object-removal', 'image-expand', 'upscaler'],
    stat: '3x',
    statLabel: 'faster edits',
  },
  socialMedia: {
    icon: FaImage,
    gradient: 'from-pink-500 to-rose-600',
    bgGradient: 'from-pink-500/10 to-rose-600/10',
    borderColor: 'border-pink-500/30',
    hoverBorder: 'hover:border-pink-500/60',
    tools: ['remove-background', 'image-expand', 'upscaler'],
    stat: '2x',
    statLabel: 'engagement',
  },
  restoration: {
    icon: FaHeart,
    gradient: 'from-cyan-500 to-teal-600',
    bgGradient: 'from-cyan-500/10 to-teal-600/10',
    borderColor: 'border-cyan-500/30',
    hoverBorder: 'hover:border-cyan-500/60',
    tools: ['colorize', 'restore', 'upscaler'],
    stat: '100%',
    statLabel: 'memories saved',
  },
  printing: {
    icon: FaPrint,
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-500/10 to-indigo-600/10',
    borderColor: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-500/60',
    tools: ['upscaler', 'restore', 'image-compressor'],
    stat: '16x',
    statLabel: 'upscale',
  },
  gaming: {
    icon: FaGamepad,
    gradient: 'from-red-500 to-orange-600',
    bgGradient: 'from-red-500/10 to-orange-600/10',
    borderColor: 'border-red-500/30',
    hoverBorder: 'hover:border-red-500/60',
    tools: ['upscaler', 'colorize', 'restore'],
    stat: '4K',
    statLabel: 'textures',
  },
  video: {
    icon: FaFilm,
    gradient: 'from-indigo-500 to-violet-600',
    bgGradient: 'from-indigo-500/10 to-violet-600/10',
    borderColor: 'border-indigo-500/30',
    hoverBorder: 'hover:border-indigo-500/60',
    tools: ['upscaler', 'remove-background', 'image-expand'],
    stat: 'HD',
    statLabel: 'thumbnails',
  },
};

// Tool info for quick access
const toolInfo: Record<string, { name: string; icon: string; href: string }> = {
  'upscaler': { name: 'AI Upscaler', icon: '🔍', href: '/tools/upscaler' },
  'remove-background': { name: 'BG Remover', icon: '✂️', href: '/tools/remove-background' },
  'colorize': { name: 'Colorizer', icon: '🎨', href: '/tools/colorize' },
  'restore': { name: 'Restore', icon: '✨', href: '/tools/restore' },
  'image-expand': { name: 'Expand', icon: '↔️', href: '/tools/image-expand' },
  'object-removal': { name: 'Object Removal', icon: '🗑️', href: '/tools/object-removal' },
  'packshot-generator': { name: 'Packshot', icon: '📦', href: '/tools/packshot-generator' },
  'image-compressor': { name: 'Compressor', icon: '📉', href: '/tools/image-compressor' },
};

// Animated counter component
function AnimatedStat({ value }: { value: string }) {
  return (
    <span className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
      {value}
    </span>
  );
}

export default function UseCasesPage() {
  const t = useTranslations('useCasesPage');
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const useCases = Object.keys(useCaseData) as (keyof typeof useCaseData)[];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-green-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <HiSparkles className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              {t('badge') || 'AI-Powered Solutions'}
            </span>
          </div>

          {/* Title */}
          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="block text-gray-900 dark:text-white mb-2">{t('heroTitle1') || 'Transform Your'}</span>
            <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              {t('heroTitleHighlight') || 'Creative Workflow'}
            </span>
          </h1>

          <p className={`text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-10 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {t('subtitle')}
          </p>

          {/* Stats Row */}
          <div className={`flex flex-wrap items-center justify-center gap-8 md:gap-16 mb-12 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="text-center">
              <AnimatedStat value="10K+" />
              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">{t('stats.activeUsers') || 'Active Users'}</p>
            </div>
            <div className="text-center">
              <AnimatedStat value="500K+" />
              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">{t('stats.imagesProcessed') || 'Images Processed'}</p>
            </div>
            <div className="text-center">
              <AnimatedStat value="12+" />
              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">{t('stats.aiTools') || 'AI Tools'}</p>
            </div>
            <div className="text-center">
              <AnimatedStat value="4.9" />
              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">{t('stats.userRating') || 'User Rating'}</p>
            </div>
          </div>

          {/* Quick CTA */}
          <div className={`flex flex-wrap items-center justify-center gap-4 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Link
              href="/tools"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-semibold hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 hover:scale-105"
            >
              <HiLightningBolt className="w-5 h-5" />
              <span>{t('heroCta.tryTools') || 'Try All Tools Free'}</span>
              <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#use-cases"
              className="flex items-center gap-2 px-6 py-3 bg-gray-200/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-xl font-semibold transition-all duration-300"
            >
              <span>{t('heroCta.exploreCases') || 'Explore Use Cases'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Industry Use Cases Grid */}
      <section id="use-cases" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gray-900 dark:text-white">{t('industriesTitle1') || 'Solutions for '}</span>
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              {t('industriesTitleHighlight') || 'Every Industry'}
            </span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            {t('industriesSubtitle') || 'Discover how professionals across different industries leverage our AI tools'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useCases.map((useCase, index) => {
            const data = useCaseData[useCase];
            const IconComponent = data.icon;

            return (
              <div
                key={useCase}
                className={`group relative bg-gradient-to-br ${data.bgGradient} border ${data.borderColor} ${data.hoverBorder} rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl cursor-pointer`}
                onMouseEnter={() => setActiveCase(useCase)}
                onMouseLeave={() => setActiveCase(null)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${data.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />

                <div className="relative">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${data.gradient} rounded-xl shadow-lg`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold bg-gradient-to-r ${data.gradient} bg-clip-text text-transparent`}>
                        {data.stat}
                      </div>
                      <div className="text-xs text-gray-500">{data.statLabel}</div>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors">
                    {t(`cases.${useCase}.title`)}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {t(`cases.${useCase}.description`)}
                  </p>

                  {/* Key Benefits */}
                  <div className="space-y-2 mb-4">
                    {['use1', 'use2', 'use3'].map((key) => (
                      <div key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <FaCheck className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span>{t(`cases.${useCase}.${key}`)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recommended Tools */}
                  <div className="pt-4 border-t border-gray-300/50 dark:border-gray-700/50">
                    <p className="text-xs text-gray-500 mb-2">{t('recommendedTools') || 'Recommended Tools'}</p>
                    <div className="flex flex-wrap gap-2">
                      {data.tools.map((tool) => (
                        <Link
                          key={tool}
                          href={toolInfo[tool].href}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-200/80 dark:bg-gray-800/80 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <span>{toolInfo[tool].icon}</span>
                          <span className="text-gray-700 dark:text-gray-300">{toolInfo[tool].name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Creative Studio Section - AI Image & AI Video */}
      <section className="py-20 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-full">
              <HiSparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {t('aiStudio.badge') || 'AI Creative Studio'}
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-gray-900 dark:text-white">{t('aiStudio.title1') || 'Create with '}</span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                {t('aiStudio.titleHighlight') || 'AI Power'}
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              {t('aiStudio.subtitle') || 'Generate stunning images and videos with state-of-the-art AI models'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* AI Image Card */}
            <Link
              href="/ai-image"
              className="group relative bg-gradient-to-br from-purple-600 via-purple-800 to-pink-700 dark:from-purple-900/80 dark:via-gray-900 dark:to-pink-900/80 border border-purple-400/50 dark:border-purple-500/30 hover:border-purple-300 dark:hover:border-purple-500/60 rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/30"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500" />

              <div className="relative">
                {/* Icon & Badge */}
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/30">
                    <FaMagic className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-purple-300">{t('aiStudio.aiImage.badge') || '12+ Models'}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors">
                  {t('aiStudio.aiImage.title') || 'AI Image Generation'}
                </h3>
                <p className="text-purple-100/80 dark:text-gray-400 mb-6">
                  {t('aiStudio.aiImage.description') || 'Create stunning images from text prompts using FLUX, Stable Diffusion, and more. Transform your ideas into visual reality.'}
                </p>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {[
                    t('aiStudio.aiImage.feature1') || 'Text-to-image with FLUX Pro & Dev',
                    t('aiStudio.aiImage.feature2') || 'Style transfer & artistic effects',
                    t('aiStudio.aiImage.feature3') || 'Image-to-image transformations',
                    t('aiStudio.aiImage.feature4') || 'Community gallery & inspiration',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-purple-100 dark:text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-white/20 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <FaCheck className="w-3 h-3 text-green-300 dark:text-purple-400" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Models preview */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['FLUX Pro', 'FLUX Dev', 'SD 3.5', 'SDXL'].map((model) => (
                    <span key={model} className="px-3 py-1 bg-white/20 dark:bg-gray-800/80 border border-white/30 dark:border-gray-700 rounded-lg text-xs font-medium text-white dark:text-gray-300">
                      {model}
                    </span>
                  ))}
                  <span className="px-3 py-1 bg-purple-400/30 border border-purple-300/50 rounded-lg text-xs font-medium text-purple-100">
                    +8 {t('aiStudio.more') || 'more'}
                  </span>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-purple-200 font-semibold group-hover:text-white transition-colors">
                  <span>{t('aiStudio.aiImage.cta') || 'Start Creating'}</span>
                  <FaArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>

            {/* AI Video Card */}
            <Link
              href="/ai-video"
              className="group relative bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-700 dark:from-cyan-900/80 dark:via-gray-900 dark:to-blue-900/80 border border-cyan-400/50 dark:border-cyan-500/30 hover:border-cyan-300 dark:hover:border-cyan-500/60 rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/30"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500" />

              <div className="relative">
                {/* Icon & Badge */}
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/30">
                    <FaVideo className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-cyan-300">{t('aiStudio.aiVideo.badge') || '5+ Models'}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-cyan-200 transition-colors">
                  {t('aiStudio.aiVideo.title') || 'AI Video Generation'}
                </h3>
                <p className="text-cyan-100/80 dark:text-gray-400 mb-6">
                  {t('aiStudio.aiVideo.description') || 'Generate cinematic videos from text with Runway, PixVerse, Veo and more. Bring your stories to life.'}
                </p>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {[
                    t('aiStudio.aiVideo.feature1') || 'Text-to-video with premium models',
                    t('aiStudio.aiVideo.feature2') || 'Up to 10 seconds video length',
                    t('aiStudio.aiVideo.feature3') || 'Multiple aspect ratios & resolutions',
                    t('aiStudio.aiVideo.feature4') || 'Prompt enhancement with AI',
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-cyan-100 dark:text-gray-300">
                      <div className="w-5 h-5 rounded-full bg-white/20 dark:bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <FaCheck className="w-3 h-3 text-green-300 dark:text-cyan-400" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Models preview */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Runway Gen4', 'Veo 3.1', 'PixVerse V5', 'Kling'].map((model) => (
                    <span key={model} className="px-3 py-1 bg-white/20 dark:bg-gray-800/80 border border-white/30 dark:border-gray-700 rounded-lg text-xs font-medium text-white dark:text-gray-300">
                      {model}
                    </span>
                  ))}
                  <span className="px-3 py-1 bg-cyan-400/30 border border-cyan-300/50 rounded-lg text-xs font-medium text-cyan-100">
                    +2 {t('aiStudio.more') || 'more'}
                  </span>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-cyan-200 font-semibold group-hover:text-white transition-colors">
                  <FaPlay className="w-3 h-3" />
                  <span>{t('aiStudio.aiVideo.cta') || 'Generate Videos'}</span>
                  <FaArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Tools Section */}
      <section className="py-16 bg-gradient-to-b from-transparent via-gray-200/50 dark:via-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gray-900 dark:text-white">{t('toolsSection.title1') || 'Powerful '}</span>
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t('toolsSection.titleHighlight') || 'AI Tools'}
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              {t('toolsSection.subtitle') || 'Professional-grade image processing at your fingertips'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'upscaler', href: '/tools/upscaler', icon: '🔍', gradient: 'from-green-500 to-emerald-600', desc: 'Enhance up to 16x' },
              { key: 'remove-background', href: '/tools/remove-background', icon: '✂️', gradient: 'from-blue-500 to-cyan-600', desc: 'One-click removal' },
              { key: 'colorize', href: '/tools/colorize', icon: '🎨', gradient: 'from-purple-500 to-pink-600', desc: 'Bring photos to life' },
              { key: 'restore', href: '/tools/restore', icon: '✨', gradient: 'from-amber-500 to-orange-600', desc: 'Fix old photos' },
              { key: 'image-expand', href: '/tools/image-expand', icon: '↔️', gradient: 'from-teal-500 to-cyan-600', desc: 'AI outpainting' },
              { key: 'object-removal', href: '/tools/object-removal', icon: '🗑️', gradient: 'from-red-500 to-rose-600', desc: 'Remove anything' },
              { key: 'packshot-generator', href: '/tools/packshot-generator', icon: '📦', gradient: 'from-indigo-500 to-violet-600', desc: 'Product photos' },
              { key: 'background-generator', href: '/tools/background-generator', icon: '🖼️', gradient: 'from-pink-500 to-rose-600', desc: 'AI backgrounds' },
            ].map((tool) => (
              <Link
                key={tool.key}
                href={tool.href}
                className="group relative p-5 bg-gray-100/30 dark:bg-gray-800/30 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity`} />
                <div className="relative flex items-start gap-3">
                  <div className={`text-3xl p-2 bg-gradient-to-br ${tool.gradient} rounded-lg`}>
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors">
                      {t(`toolsSection.tools.${tool.key}`) || tool.key}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-500">{tool.desc}</p>
                  </div>
                  <FaArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-green-500 dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gray-900 dark:text-white">{t('howItWorks.title1') || 'How It '}</span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {t('howItWorks.titleHighlight') || 'Works'}
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: HiPhotograph, title: t('howItWorks.step1.title') || 'Upload Image', desc: t('howItWorks.step1.desc') || 'Drag & drop or click to upload any image format' },
            { step: '02', icon: HiSparkles, title: t('howItWorks.step2.title') || 'Choose AI Tool', desc: t('howItWorks.step2.desc') || 'Select from 12+ professional AI enhancement tools' },
            { step: '03', icon: HiLightningBolt, title: t('howItWorks.step3.title') || 'Get Results', desc: t('howItWorks.step3.desc') || 'Download your enhanced image in seconds' },
          ].map((item, index) => (
            <div key={item.step} className="relative text-center group">
              {/* Connection line */}
              {index < 2 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-700 to-transparent" />
              )}

              <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform" />
                <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center border border-gray-300 dark:border-gray-700 group-hover:border-green-500/50 transition-colors">
                  <item.icon className="w-10 h-10 text-green-500 dark:text-green-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  {item.step}
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gradient-to-b from-transparent via-green-100/50 dark:via-green-900/10 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <FaStar key={i} className="w-6 h-6 text-yellow-400" />
              ))}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('testimonials.title') || 'Trusted by 10,000+ Professionals'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('testimonials.subtitle') || 'Join photographers, designers, and businesses worldwide'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Sarah M.', role: 'Photographer', quote: t('testimonials.quote1') || 'The AI upscaler saved my old family photos. Incredible quality!' },
              { name: 'Alex K.', role: 'E-commerce', quote: t('testimonials.quote2') || 'Background removal is instant. Cut our product photo time by 80%.' },
              { name: 'James L.', role: 'Designer', quote: t('testimonials.quote3') || 'Best colorization AI I\'ve used. Natural colors every time.' },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="p-6 bg-white/50 dark:bg-gray-800/30 border border-gray-300 dark:border-gray-700 rounded-xl"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className="w-4 h-4 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center font-bold text-white">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-teal-700 to-blue-700 dark:from-green-900/80 dark:via-gray-900 dark:to-blue-900/80 border border-green-400/50 dark:border-green-500/20 rounded-3xl p-8 md:p-12 text-center">
          {/* Background effects */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-green-400/30 dark:bg-green-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400/30 dark:bg-blue-500/20 rounded-full blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-white">{t('cta.title')}</span>
            </h2>
            <p className="text-xl text-green-100/80 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/tools"
                className="group flex items-center gap-2 px-8 py-4 bg-white text-green-700 hover:bg-green-50 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-white/30 transition-all duration-300 hover:scale-105"
              >
                <span>{t('cta.tryTools')}</span>
                <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-8 py-4 bg-white/20 dark:bg-gray-800 hover:bg-white/30 dark:hover:bg-gray-700 border border-white/40 dark:border-gray-600 rounded-xl font-semibold text-lg text-white transition-all duration-300"
              >
                {t('cta.viewPricing')}
              </Link>
            </div>

            <p className="mt-6 text-sm text-green-200/80 dark:text-gray-500">
              {t('cta.noCard') || 'No credit card required. 3 free credits to start.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
