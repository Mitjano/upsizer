'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import ToolsLayout from '@/components/ToolsLayout';
import Link from 'next/link';

// Lazy load heavy components
const AIImageGenerator = dynamic(
  () => import('@/components/ai-image/AIImageGenerator'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    ),
    ssr: false,
  }
);

const ExploreGallery = dynamic(
  () => import('@/components/ai-image/ExploreGallery'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function AIImagePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'explore' | 'my-creations'>('explore');

  return (
    <ToolsLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              AI Image Generator
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Transform your ideas into stunning visuals with AI
          </p>
        </div>

        {/* Main Generator */}
        <div className="mb-12">
          <AIImageGenerator />
        </div>

        {/* Gallery Section */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex-1 py-4 px-6 text-center font-medium transition ${
                activeTab === 'explore'
                  ? 'bg-gray-700/50 text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setActiveTab('my-creations')}
              className={`flex-1 py-4 px-6 text-center font-medium transition ${
                activeTab === 'my-creations'
                  ? 'bg-gray-700/50 text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
              }`}
            >
              My Creations
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'explore' && <ExploreGallery />}
            {activeTab === 'my-creations' && (
              session ? (
                <ExploreGallery showMyCreations />
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🔒</div>
                  <h3 className="text-xl font-semibold mb-2">Sign in to see your creations</h3>
                  <p className="text-gray-400 mb-6">
                    Create an account to save and manage your AI-generated images
                  </p>
                  <Link
                    href="/auth/signin"
                    className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
                  >
                    Sign In
                  </Link>
                </div>
              )
            )}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-4 gap-6 mt-12">
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold mb-2">Multiple Models</h3>
            <p className="text-sm text-gray-400">
              Choose from Flux, Nano Banana Pro, and more AI models
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">✏️</div>
            <h3 className="text-lg font-semibold mb-2">Text to Image</h3>
            <p className="text-sm text-gray-400">
              Generate stunning images from text descriptions
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🖼️</div>
            <h3 className="text-lg font-semibold mb-2">Image to Image</h3>
            <p className="text-sm text-gray-400">
              Edit and transform existing images with AI
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🌐</div>
            <h3 className="text-lg font-semibold mb-2">Explore Gallery</h3>
            <p className="text-sm text-gray-400">
              Discover and get inspired by community creations
            </p>
          </div>
        </div>
      </div>
    </ToolsLayout>
  );
}
