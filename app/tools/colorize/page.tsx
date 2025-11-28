'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ToolsLayout from '@/components/ToolsLayout';
import ImageColorizer from '@/components/ImageColorizer';

export default function ColorizePage() {
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
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Photo Colorization
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Bring old black & white photos to life with advanced DDColor AI technology.
            Transform vintage memories into vibrant, colorful images in seconds.
          </p>

          {credits !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 bg-purple-900/30 border border-purple-800 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-purple-200">
                {credits} credits remaining
              </span>
            </div>
          )}
        </div>

        {/* Colorizer Component */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <ImageColorizer />
          <p className="text-sm text-gray-500 mt-4 text-center">
            By uploading a file you agree to our Terms of Use and Privacy Policy.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold mb-2">Natural Colors</h3>
            <p className="text-sm text-gray-400">
              DDColor AI produces realistic, natural-looking colors that bring photos to life
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">📸</div>
            <h3 className="text-lg font-semibold mb-2">Historical Photos</h3>
            <p className="text-sm text-gray-400">
              Perfect for restoring old family photos, vintage portraits, and historical images
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Fast Processing</h3>
            <p className="text-sm text-gray-400">
              Get colorized results in seconds with our optimized AI pipeline
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How AI Colorization Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-purple-400">DDColor Technology</h3>
              <p className="text-gray-400 mb-4">
                Our colorization uses DDColor, a state-of-the-art deep learning model that understands
                the semantic content of images to apply appropriate colors. It recognizes objects, skin
                tones, sky, vegetation, and more to create natural-looking results.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Understands scene context for accurate colorization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Preserves fine details and textures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Works with portraits, landscapes, and historical photos</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-pink-400">Perfect For</h3>
              <div className="space-y-3 text-gray-400">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">📷 Family Archives:</strong> Colorize old family photos
                  and bring memories to life
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">🏛️ Historical Images:</strong> Add color to historical
                  photographs and documents
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">🎬 Film Restoration:</strong> Colorize frames from
                  classic black & white films
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <strong className="text-white">🎨 Creative Projects:</strong> Use colorization for
                  artistic and design work
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold mb-4">Tips for Best Results</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-400">
            <div>
              <h4 className="font-semibold text-white mb-2">Best Practices:</h4>
              <ul className="space-y-2 text-sm">
                <li>Use high-resolution scans of original photos</li>
                <li>Ensure the image is in focus and well-exposed</li>
                <li>Clean up scratches and damage before colorizing</li>
                <li>Works best with clear subject definition</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Pro Tips:</h4>
              <ul className="space-y-2 text-sm">
                <li>Portraits typically colorize better than complex scenes</li>
                <li>Outdoor photos with sky and vegetation work great</li>
                <li>Multiple processing can sometimes improve results</li>
                <li>Combine with upscaling for best quality restoration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolsLayout>
  );
}
