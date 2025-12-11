'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ToolsLayout from '@/components/ToolsLayout';

const ImageReimagine = dynamic(
  () => import('@/components/ImageReimagine'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function ReimaginePage() {
  const { data: session } = useSession();

  return (
    <ToolsLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-100/50 dark:from-violet-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-100/50 dark:bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-purple-100/50 dark:bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-600/20 border border-violet-300 dark:border-violet-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              <span className="text-violet-600 dark:text-violet-300">Powered by FLUX Redux AI</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gray-900 dark:text-white">AI Image </span>
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Reimagine
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Generate creative variations of your images. Same composition, endless possibilities.
              Perfect for brainstorming, A/B testing, or finding the perfect version.
            </p>

            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">1-4</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Variations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">~20s</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Per Variation</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">3</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Credits Each</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <ImageReimagine />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-violet-100 dark:from-violet-500/20 to-purple-100 dark:to-purple-500/20 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="text-4xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Multiple Variations</h3>
            <p className="text-gray-600 dark:text-gray-400">Generate 1-4 unique variations at once. Compare them side by side to find your favorite.</p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 dark:from-purple-500/20 to-fuchsia-100 dark:to-fuchsia-500/20 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="text-4xl mb-4">🎚️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Adjustable Strength</h3>
            <p className="text-gray-600 dark:text-gray-400">Control how different the variations are - from subtle tweaks to dramatic reimaginings.</p>
          </div>
          <div className="bg-gradient-to-br from-fuchsia-100 dark:from-fuchsia-500/20 to-violet-100 dark:to-violet-500/20 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Guiding Prompts</h3>
            <p className="text-gray-600 dark:text-gray-400">Add optional prompts to guide the AI in creating variations that match your vision.</p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-gray-100/50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Perfect For</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-semibold mb-2">Creative Exploration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Explore different interpretations of your concept</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold mb-2">A/B Testing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Generate options for marketing and design</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">Finding Perfection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Iterate until you find the perfect version</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">💭</div>
              <h3 className="font-semibold mb-2">Brainstorming</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Let AI help spark new creative ideas</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 border border-violet-300 dark:border-violet-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Unlock Infinite Creative Possibilities
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            Transform one image into multiple unique variations with the power of AI.
          </p>
          {!session ? (
            <Link href="/auth/signin" className="inline-block px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition">
              Get Started Free
            </Link>
          ) : (
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition">
              Start Reimagining
            </button>
          )}
        </div>
      </section>
    </ToolsLayout>
  );
}
