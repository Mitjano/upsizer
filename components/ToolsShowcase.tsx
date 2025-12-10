"use client";

import Link from "next/link";
import { useTranslations } from 'next-intl';

interface Tool {
  nameKey: string;
  href: string;
  descriptionKey: string;
  badge?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  iconColor: string;
  creditsKey: string;
}

const tools: Tool[] = [
  {
    nameKey: 'upscaler',
    href: '/tools/upscaler',
    descriptionKey: 'upscaler',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#4ade80" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    ),
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-gradient-to-br from-green-500/20 to-emerald-600/20',
    iconColor: 'text-green-400',
    creditsKey: '13',
  },
  {
    nameKey: 'bgRemover',
    href: '/tools/remove-background',
    descriptionKey: 'bgRemover',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#60a5fa" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20',
    iconColor: 'text-blue-400',
    creditsKey: '1',
  },
  {
    nameKey: 'colorize',
    href: '/tools/colorize',
    descriptionKey: 'colorize',
    badge: 'NEW',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#a78bfa" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-gradient-to-br from-violet-500/20 to-purple-600/20',
    iconColor: 'text-violet-400',
    creditsKey: '1',
  },
  {
    nameKey: 'restore',
    href: '/tools/restore',
    descriptionKey: 'restore',
    badge: 'NEW',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#22d3ee" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    color: 'from-cyan-500 to-blue-600',
    bgColor: 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20',
    iconColor: 'text-cyan-400',
    creditsKey: '1',
  },
  {
    nameKey: 'objectRemoval',
    href: '/tools/object-removal',
    descriptionKey: 'objectRemoval',
    badge: 'NEW',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#fb923c" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    color: 'from-orange-500 to-red-600',
    bgColor: 'bg-gradient-to-br from-orange-500/20 to-red-600/20',
    iconColor: 'text-orange-400',
    creditsKey: '2',
  },
  {
    nameKey: 'bgGenerator',
    href: '/tools/background-generator',
    descriptionKey: 'bgGenerator',
    badge: 'NEW',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#f472b6" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-gradient-to-br from-pink-500/20 to-rose-600/20',
    iconColor: 'text-pink-400',
    creditsKey: '3',
  },
  {
    nameKey: 'compressor',
    href: '/tools/image-compressor',
    descriptionKey: 'compressor',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#2dd4bf" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-gradient-to-br from-teal-500/20 to-cyan-600/20',
    iconColor: 'text-teal-400',
    creditsKey: 'free',
  },
  {
    nameKey: 'packshot',
    href: '/tools/packshot-generator',
    descriptionKey: 'packshot',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#fbbf24" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-gradient-to-br from-amber-500/20 to-orange-600/20',
    iconColor: 'text-amber-400',
    creditsKey: '2',
  },
  {
    nameKey: 'expand',
    href: '/tools/image-expand',
    descriptionKey: 'expand',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="#818cf8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
    ),
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/20',
    iconColor: 'text-indigo-400',
    creditsKey: '2',
  },
];

export default function ToolsShowcase() {
  const t = useTranslations('toolsShowcase');
  return (
    <section id="tools" className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full">
          <span className="text-sm font-semibold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            {t('badge')}
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
          {t('title')} <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">{t('titleHighlight')}</span>
        </h2>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
          {t('subtitle')}
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group relative bg-gradient-to-br from-gray-100/80 to-gray-200/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl overflow-hidden"
          >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

            {/* Badge */}
            {tool.badge && (
              <div className="absolute top-4 right-4">
                <span className="px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white shadow-lg shadow-green-500/30">
                  {tool.badge}
                </span>
              </div>
            )}

            <div className="relative">
              {/* Icon */}
              <div className={`w-14 h-14 ${tool.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-gray-200/50 dark:border-white/5`}>
                <div className={tool.iconColor}>
                  {tool.icon}
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-2 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {t(`tools.${tool.nameKey}.name`)}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">
                {t(`tools.${tool.descriptionKey}.description`)}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded-full">
                  {t(`credits.${tool.creditsKey}`)}
                </span>
                <div className="flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  <span>{t('tryNow')}</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-12">
        <p className="text-gray-500 mb-4">
          {t('bottomCta.text')} <span className="text-green-600 dark:text-green-400 font-semibold">{t('bottomCta.highlight')}</span> {t('bottomCta.suffix')}
        </p>
        <Link
          href="/tools/upscaler"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 rounded-xl font-bold text-lg text-white shadow-xl shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 hover:scale-105"
        >
          <span>{t('bottomCta.button')}</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
