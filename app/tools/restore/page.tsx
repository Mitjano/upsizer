'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ToolsLayout from '@/components/ToolsLayout';

// Lazy load heavy component
const ImageDenoiser = dynamic(
  () => import('@/components/ImageDenoiser'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    ),
    ssr: false,
  }
);

export default function RestorePage() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user')
        .then(res => res.json())
        .then(data => {
          if (data.credits !== undefined) setCredits(data.credits);
        })
        .catch(err => console.error('Error fetching user data:', err));
    }
  }, [session]);

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI Image Restoration
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Remove noise, grain, and compression artifacts with SwinIR AI technology.
            Restore old photos and improve image quality instantly.
          </p>

          {credits !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 bg-cyan-900/30 border border-cyan-800 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-cyan-200">
                {credits} credits remaining
              </span>
            </div>
          )}
        </div>

        {/* Denoiser Component */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <ImageDenoiser />
          <p className="text-sm text-gray-500 mt-4 text-center">
            By uploading a file you agree to our Terms of Use and Privacy Policy.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🔇</div>
            <h3 className="text-lg font-semibold mb-2">Noise Removal</h3>
            <p className="text-sm text-gray-400">
              Remove grain and noise from high ISO photos while preserving detail
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">📦</div>
            <h3 className="text-lg font-semibold mb-2">JPEG Artifact Removal</h3>
            <p className="text-sm text-gray-400">
              Clean up compression artifacts and restore smooth gradients
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-lg font-semibold mb-2">Super Resolution</h3>
            <p className="text-sm text-gray-400">
              Enhance and upscale images with intelligent detail reconstruction
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How AI Restoration Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400">SwinIR Technology</h3>
              <p className="text-gray-400 mb-4">
                SwinIR uses advanced transformer architecture to understand image structure and
                intelligently restore quality. Unlike simple filters, it understands context and
                preserves important details while removing unwanted artifacts.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Preserves fine details and textures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Removes noise without over-smoothing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>State-of-the-art image restoration results</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-blue-400">Restoration Modes</h3>
              <div className="space-y-3 text-gray-400">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">Super Resolution:</strong> General image enhancement
                  that improves overall quality and clarity
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">Denoise:</strong> Remove noise and grain from photos
                  taken in low light or high ISO
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">JPEG Artifact Removal:</strong> Clean up blocky
                  artifacts from JPEG compression
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="text-3xl mb-3">📷</div>
            <h3 className="text-lg font-semibold mb-2">Low Light Photos</h3>
            <p className="text-sm text-gray-400 mb-3">
              Fix grainy photos taken in dark conditions or with high ISO settings.
            </p>
            <div className="text-xs text-gray-500">
              Use: Denoise mode
            </div>
          </div>
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="text-3xl mb-3">🌐</div>
            <h3 className="text-lg font-semibold mb-2">Web Images</h3>
            <p className="text-sm text-gray-400 mb-3">
              Restore quality to heavily compressed images downloaded from the web.
            </p>
            <div className="text-xs text-gray-500">
              Use: JPEG Artifact Removal mode
            </div>
          </div>
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="text-3xl mb-3">📸</div>
            <h3 className="text-lg font-semibold mb-2">Old Digital Photos</h3>
            <p className="text-sm text-gray-400 mb-3">
              Enhance photos from older cameras and early smartphone photos.
            </p>
            <div className="text-xs text-gray-500">
              Use: Super Resolution mode
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold mb-4">Tips for Best Results</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-400">
            <div>
              <h4 className="font-semibold text-white mb-2">Choosing the Right Mode:</h4>
              <ul className="space-y-2 text-sm">
                <li>Grainy/noisy photos - use Denoise</li>
                <li>Blocky JPEG artifacts - use JPEG Artifact Removal</li>
                <li>General quality improvement - use Super Resolution</li>
                <li>Try multiple modes for severely degraded images</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Pro Tips:</h4>
              <ul className="space-y-2 text-sm">
                <li>Start with Super Resolution for general improvements</li>
                <li>Combine restoration with upscaling for old photos</li>
                <li>Process before colorization for vintage photos</li>
                <li>Original file formats preserve more detail than screenshots</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolsLayout>
  );
}
