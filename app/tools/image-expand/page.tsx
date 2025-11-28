'use client'

import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import ToolsLayout from '@/components/ToolsLayout'

// Lazy load heavy component
const ImageExpander = dynamic(
  () => import('@/components/ImageExpander').then((mod) => ({ default: mod.ImageExpander })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    ),
    ssr: false,
  }
)

export default function ImageExpandPage() {
  const { data: session } = useSession()
  const [userRole, setUserRole] = useState<'user' | 'premium' | 'admin'>('user')
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user')
        .then((res) => res.json())
        .then((data) => {
          if (data.role) setUserRole(data.role)
          if (data.credits !== undefined) setCredits(data.credits)
        })
        .catch((err) => console.error('Error fetching user data:', err))
    }
  }, [session])

  return (
    <ToolsLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              AI Image Expand (Uncrop)
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Extend your images beyond their original borders with AI. Perfect for changing aspect ratios,
            adding space around subjects, or creating panoramic views. <strong className="text-purple-400">Powered by FLUX.1 Fill [pro]</strong> -
            state-of-the-art AI that naturally continues your images.
          </p>

          {/* Credits Info */}
          {credits !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 bg-purple-900/30 border border-purple-800 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-purple-200">{credits} credits remaining</span>
            </div>
          )}
        </div>

        {/* Image Expander Component */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <ImageExpander userRole={userRole} />
          <p className="text-sm text-gray-500 mt-4 text-center">
            By uploading a file you agree to our Terms of Use and Privacy Policy.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Zoom Out</h3>
            <p className="text-sm text-gray-400">
              Expand your canvas by 1.5x or 2x. AI generates natural continuation of your image in all directions.
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">⬜</div>
            <h3 className="text-lg font-semibold mb-2">Make Square</h3>
            <p className="text-sm text-gray-400">
              Convert any aspect ratio to perfect square. Ideal for Instagram posts and profile pictures.
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">↔️</div>
            <h3 className="text-lg font-semibold mb-2">Directional Expand</h3>
            <p className="text-sm text-gray-400">
              Extend your image in any direction - left, right, up, or down. Perfect for repositioning subjects.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How AI Image Expansion Works</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl mb-3">📤</div>
              <h4 className="font-semibold mb-2">1. Upload</h4>
              <p className="text-sm text-gray-400">Upload your image (JPG, PNG, WEBP)</p>
            </div>
            <div>
              <div className="text-4xl mb-3">🎯</div>
              <h4 className="font-semibold mb-2">2. Choose Mode</h4>
              <p className="text-sm text-gray-400">Select zoom out, square, or directional expand</p>
            </div>
            <div>
              <div className="text-4xl mb-3">🤖</div>
              <h4 className="font-semibold mb-2">3. AI Generates</h4>
              <p className="text-sm text-gray-400">FLUX.1 Fill [pro] creates natural continuation</p>
            </div>
            <div>
              <div className="text-4xl mb-3">💾</div>
              <h4 className="font-semibold mb-2">4. Download</h4>
              <p className="text-sm text-gray-400">Get your expanded image in high quality</p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-xl border border-purple-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🎨</span> Expand Modes
            </h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <strong className="text-white">Zoom Out 1.5x:</strong> Expand canvas by 50%, revealing more of the scene
              </div>
              <div>
                <strong className="text-white">Zoom Out 2x:</strong> Double the canvas size for dramatic reveals
              </div>
              <div>
                <strong className="text-white">Make Square:</strong> Convert 16:9, 4:3, or any ratio to 1:1
              </div>
              <div>
                <strong className="text-white">Directional:</strong> Extend specifically left, right, up, or down
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl border border-indigo-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>✨</span> Features Included
            </h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <strong className="text-white">FLUX.1 Fill [pro]:</strong> State-of-the-art AI model from Black Forest Labs
              </div>
              <div>
                <strong className="text-white">Custom Prompts:</strong> Guide AI on what to generate in expanded areas
              </div>
              <div>
                <strong className="text-white">High Quality:</strong> Maintains original image quality and style
              </div>
              <div>
                <strong className="text-white">Fast Processing:</strong> Results in 10-20 seconds, only 2 credits
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Perfect For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-lg font-semibold mb-2">Social Media</h3>
              <p className="text-sm text-gray-400 mb-3">
                Convert landscape photos to square for Instagram, or expand vertical videos for YouTube thumbnails.
              </p>
              <div className="text-xs text-gray-500">Change aspect ratios without cropping</div>
            </div>

            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              <div className="text-3xl mb-3">🛍️</div>
              <h3 className="text-lg font-semibold mb-2">E-commerce</h3>
              <p className="text-sm text-gray-400 mb-3">
                Add space around products for better composition. Create room for text overlays and marketing copy.
              </p>
              <div className="text-xs text-gray-500">Professional product presentations</div>
            </div>

            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              <div className="text-3xl mb-3">🎬</div>
              <h3 className="text-lg font-semibold mb-2">Content Creators</h3>
              <p className="text-sm text-gray-400 mb-3">
                Extend backgrounds for video thumbnails, expand cropped photos, create panoramic effects.
              </p>
              <div className="text-xs text-gray-500">More creative possibilities</div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold mb-4">💡 Tips for Best Results</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-400">
            <div>
              <h4 className="font-semibold text-white mb-2">✓ Best Practices:</h4>
              <ul className="space-y-2 text-sm">
                <li>• Use high-quality source images for better expansion</li>
                <li>• Simple backgrounds (sky, grass, walls) expand best</li>
                <li>• Add custom prompts for specific content in expanded areas</li>
                <li>• Zoom Out 1.5x is safest for most images</li>
                <li>• Make Square works great for portrait/landscape conversion</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">⚡ Pro Tips:</h4>
              <ul className="space-y-2 text-sm">
                <li>• Use directional expand to reposition subjects</li>
                <li>• Describe the scene in your prompt for better results</li>
                <li>• Works best with photos, landscapes, and products</li>
                <li>• Complex patterns may require multiple attempts</li>
                <li>• 2 credits per expansion, results in 10-20 seconds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolsLayout>
  )
}
