'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ToolsLayout from '@/components/ToolsLayout';
import BackgroundGenerator from '@/components/BackgroundGenerator';

export default function BackgroundGeneratorPage() {
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
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              AI Background Generator
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Generate stunning AI backgrounds for your product photos and portraits with BRIA AI.
            Describe the background you want and let AI create it around your subject.
          </p>

          {credits !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 bg-pink-900/30 border border-pink-800 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-pink-200">
                {credits} credits remaining (3 credits per generation)
              </span>
            </div>
          )}
        </div>

        {/* Background Generator Component */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <BackgroundGenerator />
          <p className="text-sm text-gray-500 mt-4 text-center">
            By uploading a file you agree to our Terms of Use and Privacy Policy.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="text-lg font-semibold mb-2">Describe Any Background</h3>
            <p className="text-sm text-gray-400">
              Use natural language to describe the background you envision
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Perfect Integration</h3>
            <p className="text-sm text-gray-400">
              AI blends your subject naturally with the generated background
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Quick Presets</h3>
            <p className="text-sm text-gray-400">
              Choose from studio, nature, urban, and other preset backgrounds
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How to Generate Backgrounds</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-pink-400 font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold mb-2">Upload Image</h3>
              <p className="text-sm text-gray-400">
                Upload an image with transparent or removed background
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-pink-400 font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold mb-2">Describe Background</h3>
              <p className="text-sm text-gray-400">
                Choose a preset or describe your desired background
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-pink-400 font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold mb-2">Download Result</h3>
              <p className="text-sm text-gray-400">
                AI generates the background and blends it naturally
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="text-3xl mb-3">🛍️</div>
            <h3 className="text-lg font-semibold mb-2">E-commerce Products</h3>
            <p className="text-sm text-gray-400 mb-3">
              Create professional studio backgrounds for product photos without expensive photoshoots.
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="text-3xl mb-3">👤</div>
            <h3 className="text-lg font-semibold mb-2">Portrait Photography</h3>
            <p className="text-sm text-gray-400 mb-3">
              Transform portraits with beautiful studio, nature, or urban backgrounds.
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="text-lg font-semibold mb-2">Social Media Content</h3>
            <p className="text-sm text-gray-400 mb-3">
              Create eye-catching posts with unique AI-generated backgrounds.
            </p>
          </div>
        </div>

        {/* Workflow Tip */}
        <div className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 rounded-xl border border-pink-700/50 p-6 mb-12">
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <span>💡</span> Pro Tip: Complete Workflow
          </h3>
          <p className="text-gray-300 mb-4">
            For best results, use this workflow:
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-sm">
              1. Remove Background
            </span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-1 bg-pink-500/20 border border-pink-500/50 rounded-full text-sm">
              2. Generate New Background
            </span>
            <span className="text-gray-500">→</span>
            <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-sm">
              3. Upscale Result
            </span>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold mb-4">Tips for Best Results</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-400">
            <div>
              <h4 className="font-semibold text-white mb-2">Image Preparation:</h4>
              <ul className="space-y-2 text-sm">
                <li>Use transparent PNG for best results</li>
                <li>Remove background first using our tool</li>
                <li>Higher resolution images produce better results</li>
                <li>Clean cutouts with smooth edges work best</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Prompt Tips:</h4>
              <ul className="space-y-2 text-sm">
                <li>Be specific about lighting (soft, dramatic, natural)</li>
                <li>Describe the style (professional, artistic, minimal)</li>
                <li>Include color preferences in your prompt</li>
                <li>Use "refine prompt" for AI-enhanced descriptions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolsLayout>
  );
}
