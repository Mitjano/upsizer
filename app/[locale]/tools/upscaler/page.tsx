'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import ToolsLayout from '@/components/ToolsLayout';

// Lazy load heavy component
const EnhancedImageUploader = dynamic(
  () => import('@/components/EnhancedImageUploader'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function UpscalerPage() {
  const { data: session } = useSession();
  const t = useTranslations('toolsPage.upscaler');
  const tCommon = useTranslations('common');

  return (
    <ToolsLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-100/50 dark:from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300/30 dark:bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-pink-300/20 dark:bg-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-purple-600 dark:text-purple-300">{t('badge')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gray-900 dark:text-white">{t('title')} </span>
              <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 dark:from-purple-400 dark:via-pink-400 dark:to-rose-400 bg-clip-text text-transparent">
                {t('titleHighlight')}
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">8x</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('stats.maxScale')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">10s</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('stats.processing')}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">1</div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('stats.creditPerImage')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <EnhancedImageUploader />
          <p className="text-sm text-gray-500 mt-4 text-center">
            {t('uploadTerms')}
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '⚡',
              title: t('features.fast.title'),
              description: t('features.fast.description'),
              gradient: 'from-yellow-100 to-orange-100 dark:from-yellow-500/20 dark:to-orange-500/20',
            },
            {
              icon: '🎨',
              title: t('features.scale.title'),
              description: t('features.scale.description'),
              gradient: 'from-purple-100 to-pink-100 dark:from-purple-500/20 dark:to-pink-500/20',
            },
            {
              icon: '✨',
              title: t('features.face.title'),
              description: t('features.face.description'),
              gradient: 'from-blue-100 to-cyan-100 dark:from-blue-500/20 dark:to-cyan-500/20',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-600 transition`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-100/50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gray-900 dark:text-white">{t('howItWorks.title')} </span>
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">{t('howItWorks.titleHighlight')}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-600 dark:text-purple-400">Real-ESRGAN Technology</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Our upscaler uses Real-ESRGAN (Enhanced Super-Resolution Generative Adversarial Networks),
                a state-of-the-art AI model trained on millions of images. Unlike traditional upscaling that
                simply stretches pixels, Real-ESRGAN intelligently reconstructs missing details.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                  <span>Restores fine details and textures lost in low-resolution images</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                  <span>Reduces noise and compression artifacts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 dark:text-green-400 mt-1">✓</span>
                  <span>Sharpens edges and enhances clarity</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-pink-600 dark:text-pink-400">Perfect For</h3>
              <div className="space-y-3 text-gray-600 dark:text-gray-400">
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-transparent">
                  <strong className="text-gray-900 dark:text-white">📸 Photography:</strong> Enlarge photos for printing
                  without losing quality
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-transparent">
                  <strong className="text-gray-900 dark:text-white">🎮 Gaming:</strong> Upscale game textures and screenshots
                  for HD displays
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-transparent">
                  <strong className="text-gray-900 dark:text-white">🎨 Design:</strong> Enhance low-res logos, illustrations,
                  and artwork
                </div>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-transparent">
                  <strong className="text-gray-900 dark:text-white">👤 Portraits:</strong> Restore old family photos with
                  face enhancement
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upscaling Options & Formats */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-300 dark:border-purple-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <span>🔧</span> Upscaling Options
            </h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div>
                <strong className="text-gray-900 dark:text-white">2x Upscaling:</strong> Best for quick enhancements,
                ideal for web graphics and social media
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">4x Upscaling:</strong> Perfect balance of quality and
                processing time, great for most use cases
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">8x Upscaling:</strong> Maximum enhancement for printing
                large formats and professional projects
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Face Enhancement:</strong> Optional GFPGAN processing
                specifically optimized for portraits
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-300 dark:border-blue-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <span>📋</span> Supported Formats
            </h3>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <div>
                <strong className="text-gray-900 dark:text-white">Input:</strong> JPG, PNG, WebP - up to 10MB per image
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Output:</strong> High-quality PNG or JPG formats
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Resolution:</strong> Free users get low-res preview,
                Premium members unlock full resolution downloads
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Processing:</strong> Each upscale costs 1 credit,
                processed in 10-20 seconds
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gray-100 dark:bg-gray-800/20 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">💡 Tips for Best Results</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">✓ Do:</h4>
              <ul className="space-y-2 text-sm">
                <li>• Use the highest quality source image available</li>
                <li>• Enable face enhancement for portraits and selfies</li>
                <li>• Start with 2x or 4x for most images</li>
                <li>• Use 8x for images you plan to print in large format</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">✗ Avoid:</h4>
              <ul className="space-y-2 text-sm">
                <li>• Upscaling already heavily compressed or pixelated images</li>
                <li>• Using 8x on images that don&apos;t need extreme enlargement</li>
                <li>• Applying face enhancement to non-portrait images</li>
                <li>• Expecting perfect results from extremely low-quality sources</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 border border-purple-300 dark:border-purple-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('cta.title')}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Start with 3 free credits. No credit card required.
          </p>
          {!session ? (
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition shadow-lg shadow-purple-500/25"
            >
              {t('cta.getStarted')}
            </Link>
          ) : (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition shadow-lg shadow-purple-500/25"
            >
              {t('cta.startUpscaling')}
            </button>
          )}
        </div>
      </section>
    </ToolsLayout>
  );
}
