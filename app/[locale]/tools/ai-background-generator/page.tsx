'use client'

import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import ToolsLayout from '@/components/ToolsLayout'
import { RelatedTools } from '@/components/RelatedTools'
import Link from 'next/link'
import { PRESET_CATEGORIES } from '@/lib/product-shot-presets'

const ProductShotPro = dynamic(
  () => import('@/components/ProductShotPro').then((mod) => ({ default: mod.ProductShotPro })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    ),
    ssr: false,
  }
)

export default function AIBackgroundGeneratorPage() {
  const { data: session } = useSession()
  const [credits, setCredits] = useState(0)
  const t = useTranslations('aiBackgroundPage')

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user')
        .then((res) => res.json())
        .then((data) => {
          if (data.credits !== undefined) setCredits(data.credits)
        })
        .catch((err) => console.error('Error fetching user data:', err))
    }
  }, [session])

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          <div className="absolute inset-0 bg-gradient-to-b from-green-100/50 dark:from-green-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-100/50 dark:bg-green-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-emerald-100/50 dark:bg-emerald-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-600/20 border border-green-300 dark:border-green-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-green-600 dark:text-green-300">{t('badge')}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl mx-auto mb-8">
              {t('subtitle')}
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">30+</div>
                <div className="text-sm text-gray-500">{t('stats.presetsLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">~10s</div>
                <div className="text-sm text-gray-500">{t('stats.processingLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">1-4</div>
                <div className="text-sm text-gray-500">Variants per generation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">2</div>
                <div className="text-sm text-gray-500">{t('stats.creditCostLabel')}</div>
              </div>
            </div>

            {credits !== undefined && session && (
              <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded-full px-4 py-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-700 dark:text-green-200">{t('creditsRemaining', { credits })}</span>
              </div>
            )}
          </div>
        </section>

        {/* Tool Section */}
        <section className="px-6 mb-12">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <ProductShotPro />
            <p className="text-sm text-gray-500 mt-4 text-center">{t('termsNotice')}</p>
          </div>
        </section>

        {/* Categories Section - NEW */}
        <section className="px-6 mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">E-commerce Background Categories</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRESET_CATEGORIES.map((category) => (
              <div key={category.id} className={`bg-gradient-to-br ${category.gradient} rounded-xl p-4 text-center text-white`}>
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-xs opacity-80 mt-1">{category.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid - UPDATED */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-100 dark:from-green-900/20 to-emerald-100 dark:to-emerald-900/20 rounded-xl border border-gray-200 dark:border-green-700/30 p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Product Integrity</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI preserves your product exactly as it is - no distortions or modifications</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-100 dark:from-emerald-900/20 to-green-100 dark:to-green-900/20 rounded-xl border border-gray-200 dark:border-emerald-700/30 p-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Placement</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Control where your product appears - center, bottom, left, or automatic AI placement</p>
            </div>
            <div className="bg-gradient-to-br from-green-100 dark:from-green-900/20 to-emerald-100 dark:to-emerald-900/20 rounded-xl border border-gray-200 dark:border-green-700/30 p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Multiple Variants</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Generate up to 4 variants at once for A/B testing and finding the perfect shot</p>
            </div>
            <div className="bg-gradient-to-br from-amber-100 dark:from-amber-900/20 to-orange-100 dark:to-orange-900/20 rounded-xl border border-gray-200 dark:border-amber-700/30 p-6">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Pro Lighting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Professional IC-Light V2 relighting - control direction and style of lighting</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 mb-16">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-8 text-center">{t('howItWorks.title')}</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 dark:from-green-500/20 to-emerald-100 dark:to-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-green-300 dark:border-green-500/30">
                  <span className="text-2xl">📤</span>
                </div>
                <h4 className="font-semibold mb-2">{t('howItWorks.step1.title')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('howItWorks.step1.description')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 dark:from-emerald-500/20 to-green-100 dark:to-green-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-300 dark:border-emerald-500/30">
                  <span className="text-2xl">🎨</span>
                </div>
                <h4 className="font-semibold mb-2">Choose Style</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pick from 30+ e-commerce presets or describe your own background</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 dark:from-green-500/20 to-emerald-100 dark:to-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-green-300 dark:border-green-500/30">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="font-semibold mb-2">{t('howItWorks.step3.title')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">AI generates your product shot in ~10 seconds with multiple variants</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 dark:from-emerald-500/20 to-green-100 dark:to-green-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-300 dark:border-emerald-500/30">
                  <span className="text-2xl">💾</span>
                </div>
                <h4 className="font-semibold mb-2">{t('howItWorks.step4.title')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('howItWorks.step4.description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="px-6 mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">{t('useCases.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-green-500/50 transition">
              <div className="text-3xl mb-3">🛍️</div>
              <h3 className="text-lg font-semibold mb-2">{t('useCases.ecommerce.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('useCases.ecommerce.description')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-green-500/50 transition">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-lg font-semibold mb-2">{t('useCases.socialMedia.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('useCases.socialMedia.description')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-green-500/50 transition">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="text-lg font-semibold mb-2">{t('useCases.dropshipping.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('useCases.dropshipping.description')}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-green-500/50 transition">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold mb-2">{t('useCases.marketing.title')}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('useCases.marketing.description')}</p>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-100 dark:from-green-900/20 to-emerald-100 dark:to-emerald-900/20 rounded-xl border border-gray-200 dark:border-green-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🤖</span> Bria Product Shot AI
              </h3>
              <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm">
                <p>Powered by Bria AI - the leading commercial-safe AI for product photography.</p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Preserves 100% product integrity
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Commercial-safe licensed AI
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Optimized for e-commerce
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    Multiple variants in one click
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-100 dark:from-amber-900/20 to-orange-100 dark:to-orange-900/20 rounded-xl border border-gray-200 dark:border-amber-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>💡</span> IC-Light V2 Relighting
              </h3>
              <div className="space-y-3 text-gray-700 dark:text-gray-300 text-sm">
                <p>Professional lighting control with IC-Light V2 - the most advanced AI relighting model.</p>
                <ul className="space-y-2 mt-4">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">★</span>
                    Control light direction (Left, Right, Top, Bottom)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">★</span>
                    Studio, natural & dramatic presets
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">★</span>
                    High-resolution enhancement
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500">★</span>
                    Perfect for premium products
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-6 mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center">{t('faq.title')}</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t(`faq.q${num}.question`)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t(`faq.q${num}.answer`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Tools */}
        <section className="px-6 mb-16">
          <RelatedTools currentSlug="ai-background-generator" />
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-12">
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl border border-green-300 dark:border-green-500/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('cta.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/pricing" className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition">
                {t('cta.getCredits')}
              </Link>
              <Link href="/tools" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
                {t('cta.exploreTools')}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ToolsLayout>
  )
}
