'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ToolsLayout from '@/components/ToolsLayout';
import { BackgroundRemover } from '@/components/BackgroundRemover';
import { ProcessedImagesGallery } from '@/components/ProcessedImagesGallery';

export default function RemoveBackgroundPage() {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<'user' | 'premium' | 'admin'>('user');
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (session?.user?.email) {
      // Fetch user data
      fetch('/api/user')
        .then(res => res.json())
        .then(data => {
          if (data.role) setUserRole(data.role);
          if (data.credits !== undefined) setCredits(data.credits);
        })
        .catch(err => console.error('Error fetching user data:', err));
    }
  }, [session]);

  return (
    <>
      <ToolsLayout>
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                AI Background Remover
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Remove backgrounds from images instantly using advanced BRIA RMBG 2.0 AI technology.
              Perfect for product photos, portraits, profile pictures, and e-commerce listings.
            </p>

            {/* Credits Info */}
            {credits !== undefined && (
              <div className="mt-4 inline-flex items-center gap-2 bg-blue-900/30 border border-blue-800 rounded-full px-4 py-2">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-200">
                  {credits} credits remaining
                </span>
              </div>
            )}
          </div>

          {/* Background Remover Component */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
            <BackgroundRemover userRole={userRole} />
            <p className="text-sm text-gray-500 mt-4 text-center">
              By uploading a file you agree to our Terms of Use and Privacy Policy.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-400">
                Remove backgrounds in 5-10 seconds with our optimized BRIA RMBG 2.0 AI model
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-lg font-semibold mb-2">Precise Edge Detection</h3>
              <p className="text-sm text-gray-400">
                Advanced AI with 256 levels of transparency for perfect cutouts and natural edges
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-gray-400">
                Your images are processed securely and automatically deleted after 24 hours
              </p>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Your Processed Images
              </h2>
              <span className="text-sm text-gray-500">
                Recent images with removed backgrounds
              </span>
            </div>
            <ProcessedImagesGallery userRole={userRole} />
          </div>

          {/* How It Works Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">How AI Background Removal Works</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-blue-400">BRIA RMBG 2.0 Technology</h3>
                <p className="text-gray-400 mb-4">
                  Our background remover uses BRIA RMBG 2.0, an advanced AI model specifically trained for
                  background removal. It analyzes each pixel to determine which parts belong to the foreground
                  subject and which are background, creating perfect cutouts with natural edges.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>256 levels of alpha transparency for smooth, natural edges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Handles complex subjects like hair, fur, and fine details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Works with any type of background - solid, gradient, or complex</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3 text-cyan-400">Perfect For</h3>
                <div className="space-y-3 text-gray-400">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">🛍️ E-commerce:</strong> Create professional product photos
                    with white or transparent backgrounds
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">📱 Social Media:</strong> Stand out with clean profile
                    pictures and engaging posts
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">🎨 Graphic Design:</strong> Isolate subjects for
                    compositions, presentations, and marketing materials
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <strong className="text-white">💼 Professional:</strong> Create polished headshots
                    and portfolio images
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>🎯</span> Download Options
              </h3>
              <div className="space-y-3 text-gray-300">
                <div>
                  <strong className="text-white">Low Resolution (512px):</strong> Perfect for web use,
                  social media, and quick previews - available for free users
                </div>
                <div>
                  <strong className="text-white">Medium Resolution (1024px):</strong> Great balance for
                  most professional uses - Premium only
                </div>
                <div>
                  <strong className="text-white">High Resolution (2048px):</strong> Excellent for printing
                  and large displays - Premium only
                </div>
                <div>
                  <strong className="text-white">Original Resolution:</strong> Keep the exact dimensions
                  of your input image - Premium only
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-700/50 p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span>📋</span> Format & Quality
              </h3>
              <div className="space-y-3 text-gray-300">
                <div>
                  <strong className="text-white">PNG Format:</strong> Transparent background, perfect for
                  overlays and web graphics - available for all users
                </div>
                <div>
                  <strong className="text-white">JPG Format:</strong> White background, smaller file size,
                  great for e-commerce - Premium only
                </div>
                <div>
                  <strong className="text-white">Processing Time:</strong> Most images processed in 5-10
                  seconds with enterprise-grade servers
                </div>
                <div>
                  <strong className="text-white">Credit Cost:</strong> 1 credit per image removal, includes
                  unlimited downloads in 24 hours
                </div>
              </div>
            </div>
          </div>

          {/* Use Cases Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Popular Use Cases</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="text-3xl mb-3">🛒</div>
                <h3 className="text-lg font-semibold mb-2">E-commerce Products</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Create consistent, professional product images for your online store. Remove distracting
                  backgrounds and add white or custom backgrounds.
                </p>
                <div className="text-xs text-gray-500">
                  Perfect for: Shopify, Amazon, eBay, Etsy
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="text-3xl mb-3">📸</div>
                <h3 className="text-lg font-semibold mb-2">Profile Pictures</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Create professional headshots for LinkedIn, resumes, and business cards. Remove busy
                  backgrounds and present yourself professionally.
                </p>
                <div className="text-xs text-gray-500">
                  Perfect for: LinkedIn, CV, business profiles
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="text-3xl mb-3">🎨</div>
                <h3 className="text-lg font-semibold mb-2">Design Projects</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Isolate subjects for graphic design, create collages, or combine elements from different
                  photos into cohesive compositions.
                </p>
                <div className="text-xs text-gray-500">
                  Perfect for: Photoshop, Canva, presentations
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="text-lg font-semibold mb-2">Social Media Content</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Create eye-catching posts, stories, and ads. Remove backgrounds to make your content
                  stand out in crowded feeds.
                </p>
                <div className="text-xs text-gray-500">
                  Perfect for: Instagram, Facebook, TikTok
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="text-3xl mb-3">🏠</div>
                <h3 className="text-lg font-semibold mb-2">Real Estate</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Enhance property photos by removing unwanted elements, creating clean product shots
                  of furniture, or preparing marketing materials.
                </p>
                <div className="text-xs text-gray-500">
                  Perfect for: Listings, brochures, staging
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
                <div className="text-3xl mb-3">💍</div>
                <h3 className="text-lg font-semibold mb-2">Wedding & Events</h3>
                <p className="text-sm text-gray-400 mb-3">
                  Isolate subjects from event photos for invitations, thank-you cards, or special
                  commemorative prints with artistic backgrounds.
                </p>
                <div className="text-xs text-gray-500">
                  Perfect for: Invitations, albums, prints
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-4">💡 Tips for Perfect Background Removal</h2>
            <div className="grid md:grid-cols-2 gap-6 text-gray-400">
              <div>
                <h4 className="font-semibold text-white mb-2">✓ Best Practices:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Use well-lit photos with clear subject definition</li>
                  <li>• Ensure good contrast between subject and background</li>
                  <li>• Take photos with the subject in focus</li>
                  <li>• Avoid shadows that blend into the subject</li>
                  <li>• Use the highest resolution available for better results</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">⚡ Pro Tips:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• For hair and fur, use original resolution (Premium)</li>
                  <li>• PNG format preserves transparency for overlays</li>
                  <li>• JPG format with white background is great for print</li>
                  <li>• Download multiple resolutions for different uses</li>
                  <li>• Images remain available for 24 hours after processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ToolsLayout>
    </>
  );
}
