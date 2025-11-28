'use client';

import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import ToolsLayout from '@/components/ToolsLayout';

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
  const { data: session, status } = useSession();

  return (
    <>
      <ToolsLayout>
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AI Image Compressor
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Reduce file size while maintaining high quality with smart compression
            </p>
          </div>

          {/* Compressor Component */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
            <ImageCompressor />
            <p className="text-sm text-gray-500 mt-4 text-center">
              By uploading a file you agree to our Terms of Use and Privacy Policy.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="text-lg font-semibold mb-2">Smart Compression</h3>
              <p className="text-sm text-gray-400">
                AI-powered compression reduces file size by up to 80% while preserving quality
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-400">
                Process images in seconds with our optimized compression pipeline
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-lg font-semibold mb-2">Multiple Formats</h3>
              <p className="text-sm text-gray-400">
                Support for JPG, PNG, and WebP with automatic format selection
              </p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">How Smart Compression Works</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-blue-400">Advanced Compression</h3>
                <p className="text-gray-400 mb-4">
                  Our compressor uses Sharp's advanced image processing algorithms combined with
                  format-specific optimizations. Unlike basic compression that just reduces quality,
                  our AI-powered system intelligently removes unnecessary data while preserving
                  visual quality.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Removes metadata and unnecessary information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Optimizes color palettes and encoding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Progressive loading for better web performance</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-cyan-400">Perfect For</h3>
                <div className="space-y-3 text-gray-400">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">🌐 Websites:</strong> Reduce page load times
                    and improve SEO
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">📱 Mobile Apps:</strong> Save bandwidth and
                    storage space
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">📧 Email:</strong> Attach more images without
                    size limits
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">☁️ Cloud Storage:</strong> Store more images
                    in less space
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>⚙️</span> Compression Settings
              </h3>
              <div className="space-y-3 text-gray-300">
                <div>
                  <strong className="text-white">Quality Control:</strong> Adjust from 10% to 100%
                  to balance file size vs quality
                </div>
                <div>
                  <strong className="text-white">Auto Format:</strong> Automatically selects the
                  best format for your image
                </div>
                <div>
                  <strong className="text-white">JPG:</strong> Best for photos and complex images
                  with many colors
                </div>
                <div>
                  <strong className="text-white">PNG:</strong> Best for graphics with transparency
                  or sharp edges
                </div>
                <div>
                  <strong className="text-white">WebP:</strong> Modern format with superior
                  compression for web
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>📋</span> Supported Formats
              </h3>
              <div className="space-y-3 text-gray-300">
                <div>
                  <strong className="text-white">Input:</strong> JPG, PNG, WebP - up to 20MB per image
                </div>
                <div>
                  <strong className="text-white">Output:</strong> Choose between JPG, PNG, or WebP
                </div>
                <div>
                  <strong className="text-white">Compression:</strong> Reduce file size by 30-80%
                  depending on settings
                </div>
                <div>
                  <strong className="text-white">Processing:</strong> Each compression costs 1 credit,
                  processed in 2-5 seconds
                </div>
                <div>
                  <strong className="text-white">Download:</strong> Get instant download of compressed
                  image
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-4">💡 Tips for Best Results</h2>
            <div className="grid md:grid-cols-2 gap-6 text-gray-400">
              <div>
                <h4 className="font-semibold text-white mb-2">✓ Recommended:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Start with 80% quality for a good balance</li>
                  <li>• Use auto format for best compression ratio</li>
                  <li>• JPG works best for photos and complex images</li>
                  <li>• PNG is better for graphics with transparency</li>
                  <li>• WebP offers best compression for modern browsers</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">⚠️ Keep in Mind:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Lower quality = smaller file but visible artifacts</li>
                  <li>• Already compressed images won't reduce much more</li>
                  <li>• Test different quality settings for your use case</li>
                  <li>• Keep original files as backup before compressing</li>
                  <li>• Compression is permanent - cannot be reversed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ToolsLayout>
    </>
  );
}
