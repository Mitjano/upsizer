'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Lazy load heavy component
const ImageCompressor = dynamic(
  () => import('@/components/ImageCompressor'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function ImageCompressorPage() {
  const { data: session } = useSession();
  const t = useTranslations('imageCompressorPage');

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-8 pb-12">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-blue-300">{t('badge')}</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto mb-8">
              {t('subtitle')}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{t('stats.sizeReduction')}</div>
                <div className="text-sm text-gray-500">{t('stats.sizeReductionLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{t('stats.processing')}</div>
                <div className="text-sm text-gray-500">{t('stats.processingLabel')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{t('stats.creditCost')}</div>
                <div className="text-sm text-gray-500">{t('stats.creditCostLabel')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool Section */}
        <section className="px-6 mb-12">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <ImageCompressor />
            <p className="text-sm text-gray-500 mt-4 text-center">
              {t('termsNotice')}
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-700/30 p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📦</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.smartCompression.title')}</h3>
              <p className="text-sm text-gray-400">
                {t('features.smartCompression.description')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl border border-cyan-700/30 p-6">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.lightningFast.title')}</h3>
              <p className="text-sm text-gray-400">
                {t('features.lightningFast.description')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-700/30 p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('features.multipleFormats.title')}</h3>
              <p className="text-sm text-gray-400">
                {t('features.multipleFormats.description')}
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 mb-16">
          <div className="bg-gray-800/30 rounded-2xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-8 text-center">{t('howItWorks.title')}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-blue-400">{t('howItWorks.advancedTechnology.title')}</h3>
                <p className="text-gray-400 mb-4">
                  {t('howItWorks.advancedTechnology.description')}
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{t('howItWorks.advancedTechnology.feature1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{t('howItWorks.advancedTechnology.feature2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{t('howItWorks.advancedTechnology.feature3')}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-cyan-400">{t('howItWorks.perfectFor.title')}</h3>
                <div className="space-y-3 text-gray-400">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">🌐 {t('howItWorks.perfectFor.websites')}</strong> {t('howItWorks.perfectFor.websitesDesc')}
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">📱 {t('howItWorks.perfectFor.mobileApps')}</strong> {t('howItWorks.perfectFor.mobileAppsDesc')}
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">📧 {t('howItWorks.perfectFor.email')}</strong> {t('howItWorks.perfectFor.emailDesc')}
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">☁️ {t('howItWorks.perfectFor.cloudStorage')}</strong> {t('howItWorks.perfectFor.cloudStorageDesc')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section className="px-6 mb-16">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>⚙️</span> {t('technicalDetails.compressionSettings.title')}
              </h3>
              <div className="space-y-3 text-gray-300 text-sm">
                <div>
                  <strong className="text-white">{t('technicalDetails.compressionSettings.qualityControl')}</strong> {t('technicalDetails.compressionSettings.qualityControlDesc')}
                </div>
                <div>
                  <strong className="text-white">{t('technicalDetails.compressionSettings.autoFormat')}</strong> {t('technicalDetails.compressionSettings.autoFormatDesc')}
                </div>
                <div>
                  <strong className="text-white">{t('technicalDetails.compressionSettings.jpg')}</strong> {t('technicalDetails.compressionSettings.jpgDesc')}
                </div>
                <div>
                  <strong className="text-white">{t('technicalDetails.compressionSettings.png')}</strong> {t('technicalDetails.compressionSettings.pngDesc')}
                </div>
                <div>
                  <strong className="text-white">{t('technicalDetails.compressionSettings.webp')}</strong> {t('technicalDetails.compressionSettings.webpDesc')}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 rounded-xl border border-cyan-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>📋</span> {t('technicalDetails.supportedFormats.title')}
              </h3>
              <div className="space-y-3 text-gray-300 text-sm">
                <div>
                  <strong className="text-white">{t('technicalDetails.supportedFormats.input')}</strong> {t('technicalDetails.supportedFormats.inputDesc')}
                </div>
                <div>
                  <strong className="text-white">{t('technicalDetails.supportedFormats.output')}</strong> {t('technicalDetails.supportedFormats.outputDesc')}
                </div>
                <div>
                  <strong className="text-white">{t('technicalDetails.supportedFormats.compression')}</strong> {t('technicalDetails.supportedFormats.compressionDesc')}
                </div>
                <div>
                  <strong className="text-white">{t('technicalDetails.supportedFormats.processing')}</strong> {t('technicalDetails.supportedFormats.processingDesc')}
                </div>
                <div>
                  <strong className="text-white">{t('technicalDetails.supportedFormats.download')}</strong> {t('technicalDetails.supportedFormats.downloadDesc')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="px-6 mb-16">
          <div className="bg-gray-800/30 rounded-2xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-6">{t('tips.title')}</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-blue-400 mb-3">{t('tips.recommended.title')}</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    {t('tips.recommended.tip1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    {t('tips.recommended.tip2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    {t('tips.recommended.tip3')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    {t('tips.recommended.tip4')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    {t('tips.recommended.tip5')}
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-cyan-400 mb-3">{t('tips.keepInMind.title')}</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">⚠</span>
                    {t('tips.keepInMind.tip1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">⚠</span>
                    {t('tips.keepInMind.tip2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">⚠</span>
                    {t('tips.keepInMind.tip3')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">⚠</span>
                    {t('tips.keepInMind.tip4')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">⚠</span>
                    {t('tips.keepInMind.tip5')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 pb-12">
          <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-2xl border border-blue-700/30 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('cta.title')}</h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/pricing"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg font-semibold transition"
              >
                {t('cta.getCredits')}
              </Link>
              <Link
                href="/tools"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
              >
                {t('cta.exploreTools')}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </ToolsLayout>
  );
}
