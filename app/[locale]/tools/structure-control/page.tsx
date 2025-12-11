'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ToolsLayout from '@/components/ToolsLayout';

const StructureControl = dynamic(
  () => import('@/components/StructureControl'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function StructureControlPage() {
  const { data: session } = useSession();

  return (
    <ToolsLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/50 dark:from-amber-900/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100/50 dark:bg-amber-600/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-orange-100/50 dark:bg-orange-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-600/20 border border-amber-300 dark:border-amber-500/30 rounded-full text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-amber-600 dark:text-amber-300">Powered by FLUX Depth & Canny Pro</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gray-900 dark:text-white">AI </span>
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Structure Control
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Generate completely new images while preserving the structure and composition of your reference.
              Perfect for concept art, redesigns, and creative transformations.
            </p>

            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">2</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Control Modes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">~40s</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Processing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">4</div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Credits/Image</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tool Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <StructureControl />
        </div>
      </section>

      {/* Control Modes */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Two Powerful Control Modes</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-amber-100 dark:from-amber-500/20 to-orange-100 dark:to-orange-500/20 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="text-4xl mb-4">🔲</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Depth Control</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Preserves the 3D structure, depth, and perspective of your image. Perfect for:</p>
            <ul className="text-sm text-gray-700 dark:text-gray-500 space-y-1">
              <li>• Interior redesign concepts</li>
              <li>• Landscape transformations</li>
              <li>• Product mockups</li>
              <li>• Architectural visualization</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-orange-100 dark:from-orange-500/20 to-red-100 dark:to-red-500/20 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
            <div className="text-4xl mb-4">📐</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Edge Control</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Preserves the shapes, outlines, and contours of your image. Perfect for:</p>
            <ul className="text-sm text-gray-700 dark:text-gray-500 space-y-1">
              <li>• Logo redesign concepts</li>
              <li>• Character transformations</li>
              <li>• Pattern conversions</li>
              <li>• Line art to illustration</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gray-100/50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">1</div>
              <h3 className="font-semibold mb-2">Upload Reference</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload an image with the structure/composition you want to preserve</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">2</div>
              <h3 className="font-semibold mb-2">Choose Mode & Prompt</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Select Depth or Edge control and describe what you want to generate</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">3</div>
              <h3 className="font-semibold mb-2">Generate</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI creates a new image following your reference structure</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Structure-Guided AI Generation
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-8">
            The power of AI image generation with the precision of structure preservation.
            Turn any reference into something entirely new.
          </p>
          {!session ? (
            <Link href="/auth/signin" className="inline-block px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-lg transition">
              Get Started Free
            </Link>
          ) : (
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl font-semibold text-lg transition">
              Start Creating
            </button>
          )}
        </div>
      </section>
    </ToolsLayout>
  );
}
