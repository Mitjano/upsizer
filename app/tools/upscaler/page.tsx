'use client';

import { useSession } from 'next-auth/react';
import ToolsLayout from '@/components/ToolsLayout';
import EnhancedImageUploader from '@/components/EnhancedImageUploader';

export default function UpscalerPage() {
  const { data: session, status } = useSession();

  return (
    <>
      <ToolsLayout>
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Image Upscaler
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Enhance and enlarge your images up to 8x using Real-ESRGAN AI technology
            </p>
          </div>

          {/* Upscaler Component */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
            <EnhancedImageUploader />
            <p className="text-sm text-gray-500 mt-4 text-center">
              By uploading a file you agree to our Terms of Use and Privacy Policy.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-400">
                Process images in 10-20 seconds with our optimized AI pipeline
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-lg font-semibold mb-2">Up to 8x Scale</h3>
              <p className="text-sm text-gray-400">
                Choose 2x, 4x, or 8x upscaling for maximum detail enhancement
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="text-lg font-semibold mb-2">Face Enhancement</h3>
              <p className="text-sm text-gray-400">
                Optional GFPGAN model for enhanced face restoration
              </p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">How AI Image Upscaling Works</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-purple-400">Real-ESRGAN Technology</h3>
                <p className="text-gray-400 mb-4">
                  Our upscaler uses Real-ESRGAN (Enhanced Super-Resolution Generative Adversarial Networks),
                  a state-of-the-art AI model trained on millions of images. Unlike traditional upscaling that
                  simply stretches pixels, Real-ESRGAN intelligently reconstructs missing details.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Restores fine details and textures lost in low-resolution images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Reduces noise and compression artifacts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Sharpens edges and enhances clarity</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-pink-400">Perfect For</h3>
                <div className="space-y-3 text-gray-400">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">📸 Photography:</strong> Enlarge photos for printing
                    without losing quality
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">🎮 Gaming:</strong> Upscale game textures and screenshots
                    for HD displays
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">🎨 Design:</strong> Enhance low-res logos, illustrations,
                    and artwork
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">👤 Portraits:</strong> Restore old family photos with
                    face enhancement
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🔧</span> Upscaling Options
              </h3>
              <div className="space-y-3 text-gray-300">
                <div>
                  <strong className="text-white">2x Upscaling:</strong> Best for quick enhancements,
                  ideal for web graphics and social media
                </div>
                <div>
                  <strong className="text-white">4x Upscaling:</strong> Perfect balance of quality and
                  processing time, great for most use cases
                </div>
                <div>
                  <strong className="text-white">8x Upscaling:</strong> Maximum enhancement for printing
                  large formats and professional projects
                </div>
                <div>
                  <strong className="text-white">Face Enhancement:</strong> Optional GFPGAN processing
                  specifically optimized for portraits
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>📋</span> Supported Formats
              </h3>
              <div className="space-y-3 text-gray-300">
                <div>
                  <strong className="text-white">Input:</strong> JPG, PNG, WebP - up to 10MB per image
                </div>
                <div>
                  <strong className="text-white">Output:</strong> High-quality PNG or JPG formats
                </div>
                <div>
                  <strong className="text-white">Resolution:</strong> Free users get low-res preview,
                  Premium members unlock full resolution downloads
                </div>
                <div>
                  <strong className="text-white">Processing:</strong> Each upscale costs 1 credit,
                  processed in 10-20 seconds
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-4">💡 Tips for Best Results</h2>
            <div className="grid md:grid-cols-2 gap-6 text-gray-400">
              <div>
                <h4 className="font-semibold text-white mb-2">✓ Do:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Use the highest quality source image available</li>
                  <li>• Enable face enhancement for portraits and selfies</li>
                  <li>• Start with 2x or 4x for most images</li>
                  <li>• Use 8x for images you plan to print in large format</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">✗ Avoid:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Upscaling already heavily compressed or pixelated images</li>
                  <li>• Using 8x on images that don't need extreme enlargement</li>
                  <li>• Applying face enhancement to non-portrait images</li>
                  <li>• Expecting perfect results from extremely low-quality sources</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ToolsLayout>
    </>
  );
}
