'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import ToolsLayout from '@/components/ToolsLayout'
import { PackshotGenerator } from '@/components/PackshotGenerator'

export default function PackshotGeneratorPage() {
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
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              AI Product Packshot Generator
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Transform any product photo into a professional 2000x2000px packshot with AI. Perfect for Amazon, e-commerce,
            and marketplace listings. <strong className="text-green-400">One-click solution</strong> powered by Bria AI - remove backgrounds, center products, and optimize automatically.
          </p>

          {/* Credits Info */}
          {credits !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-900/30 border border-green-800 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-green-200">{credits} credits remaining</span>
            </div>
          )}
        </div>

        {/* Packshot Generator Component */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <PackshotGenerator userRole={userRole} />
          <p className="text-sm text-gray-500 mt-4 text-center">
            By uploading a file you agree to our Terms of Use and Privacy Policy.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Marketplace Ready</h3>
            <p className="text-sm text-gray-400">
              Generate packshots optimized for Amazon (2000x2000), Allegro (1600x1200), and Instagram (1080x1080)
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-400">
              Automatic background removal, smart cropping, professional shadows, and perfect centering
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">💎</div>
            <h3 className="text-lg font-semibold mb-2">Professional Quality</h3>
            <p className="text-sm text-gray-400">
              Studio-quality results without expensive equipment or photographers. Ready in 10-20 seconds
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How AI Packshot Generation Works</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl mb-3">📤</div>
              <h4 className="font-semibold mb-2">1. Upload</h4>
              <p className="text-sm text-gray-400">Upload your product photo (even from a phone)</p>
            </div>
            <div>
              <div className="text-4xl mb-3">✂️</div>
              <h4 className="font-semibold mb-2">2. Remove BG</h4>
              <p className="text-sm text-gray-400">AI removes background with precision</p>
            </div>
            <div>
              <div className="text-4xl mb-3">🎨</div>
              <h4 className="font-semibold mb-2">3. Add Polish</h4>
              <p className="text-sm text-gray-400">Add background, shadow, crop & resize</p>
            </div>
            <div>
              <div className="text-4xl mb-3">💾</div>
              <h4 className="font-semibold mb-2">4. Download</h4>
              <p className="text-sm text-gray-400">Get marketplace-ready packshot</p>
            </div>
          </div>
        </div>

        {/* Preset Details */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🎯</span> Background Options
            </h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <strong className="text-white">White Background:</strong> Classic white 2000x2000px, perfect for
                Amazon listings and product catalogs
              </div>
              <div>
                <strong className="text-white">Light Gray:</strong> Professional gray background, elegant and clean
              </div>
              <div>
                <strong className="text-white">Beige:</strong> Warm, natural beige tone for organic products
              </div>
              <div>
                <strong className="text-white">Light Blue:</strong> Fresh, modern blue background for tech products
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 rounded-xl border border-emerald-700/50 p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>✨</span> Features Included
            </h3>
            <div className="space-y-3 text-gray-300">
              <div>
                <strong className="text-white">Professional AI:</strong> Powered by Bria AI, trained on commercial-safe data
              </div>
              <div>
                <strong className="text-white">Smart Positioning:</strong> Products automatically centered with optimal padding
              </div>
              <div>
                <strong className="text-white">Perfect Sizing:</strong> Standard 2000x2000px output for all marketplaces
              </div>
              <div>
                <strong className="text-white">Fast Processing:</strong> Results in just 5-10 seconds
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Perfect For</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              <div className="text-3xl mb-3">🛍️</div>
              <h3 className="text-lg font-semibold mb-2">E-commerce Sellers</h3>
              <p className="text-sm text-gray-400 mb-3">
                Create consistent product photos for your online store. Amazon, eBay, Shopify, Allegro - all covered.
              </p>
              <div className="text-xs text-gray-500">Save time and money on product photography</div>
            </div>

            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              <div className="text-3xl mb-3">📦</div>
              <h3 className="text-lg font-semibold mb-2">Dropshippers</h3>
              <p className="text-sm text-gray-400 mb-3">
                Transform supplier photos into professional listings. Stand out from competition with better images.
              </p>
              <div className="text-xs text-gray-500">Professional look without photo studio</div>
            </div>

            <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-lg font-semibold mb-2">Social Media Marketers</h3>
              <p className="text-sm text-gray-400 mb-3">
                Create eye-catching product posts for Instagram, Facebook. Consistent branding across all platforms.
              </p>
              <div className="text-xs text-gray-500">Perfect square format for social media</div>
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
                <li>• Use well-lit photos with clear product definition</li>
                <li>• Ensure product is in focus and centered</li>
                <li>• Avoid shadows that blend into the product</li>
                <li>• Higher resolution input = better output quality</li>
                <li>• Works best with single products (not groups)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">⚡ Pro Tips:</h4>
              <ul className="space-y-2 text-sm">
                <li>• White background for Amazon marketplace compliance</li>
                <li>• Gray background for elegant, professional look</li>
                <li>• Beige for warm, natural product presentation</li>
                <li>• Blue for fresh, modern tech products</li>
                <li>• All packshots: 1 credit, 2000x2000px output</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolsLayout>
  )
}
