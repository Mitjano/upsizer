'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ToolsLayout from '@/components/ToolsLayout';

const InpaintingPro = dynamic(
  () => import('@/components/InpaintingPro'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function InpaintingPage() {
  const { data: session } = useSession();

  return (
    <ToolsLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-100/50 dark:from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-100 dark:bg-cyan-600/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-blue-100 dark:bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 dark:bg-cyan-600/20 border border-cyan-300 dark:border-cyan-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-cyan-600 dark:text-cyan-300">Powered by FLUX Fill Pro AI</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gray-900 dark:text-white">AI </span>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Inpainting Pro
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Fill, replace, or extend parts of your images with AI-generated content.
              Paint over any area and describe what should appear - FLUX Fill Pro handles the rest.
            </p>

            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Pro</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Quality</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">~45s</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">5</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Credits/Image</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <InpaintingPro />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-cyan-100 dark:from-cyan-500/20 to-blue-100 dark:to-blue-500/20 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="text-4xl mb-4">🖌️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Smart Fill</h3>
            <p className="text-gray-600 dark:text-gray-400">Paint over unwanted objects and let AI seamlessly fill the area with matching content.</p>
          </div>
          <div className="bg-gradient-to-br from-blue-100 dark:from-blue-500/20 to-indigo-100 dark:to-indigo-500/20 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Prompt-Based</h3>
            <p className="text-gray-600 dark:text-gray-400">Describe what you want to appear in the painted area for precise, creative results.</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-100 dark:from-indigo-500/20 to-cyan-100 dark:to-cyan-500/20 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Adjustable Brush</h3>
            <p className="text-gray-600 dark:text-gray-400">Variable brush size for precise masking - from fine details to large areas.</p>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-gray-100/50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Perfect For</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">🗑️</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Remove Objects</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Remove unwanted elements from photos</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Replace Content</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Swap elements with something new</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">🖼️</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Extend Images</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add content beyond original borders</p>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 text-center">
              <div className="text-3xl mb-3">🔧</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Fix Imperfections</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Repair damaged or missing parts</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 border border-cyan-300 dark:border-cyan-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Advanced AI Inpainting at Your Fingertips
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            The same technology used by professional photo editors - now available to everyone.
          </p>
          {!session ? (
            <Link href="/auth/signin" className="inline-block px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 rounded-xl font-semibold text-lg transition">
              Get Started Free
            </Link>
          ) : (
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 rounded-xl font-semibold text-lg transition">
              Start Inpainting
            </button>
          )}
        </div>
      </section>
    </ToolsLayout>
  );
}
