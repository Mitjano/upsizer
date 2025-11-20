'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ToolsLayout from '@/components/ToolsLayout';
import BackgroundRemover from '@/components/BackgroundRemover';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RemoveBackgroundPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <>
      <Header />
      <ToolsLayout>
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Background Remover
              </span>
            </h1>
            <p className="text-gray-400 text-lg">
              Remove backgrounds from images using state-of-the-art BRIA RMBG 2.0 AI
            </p>
          </div>

          {/* Background Remover Component */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
            <BackgroundRemover />
            <p className="text-sm text-gray-500 mt-4 text-center">
              By uploading a file you agree to our Terms of Use and Privacy Policy.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">✂️</div>
              <h3 className="text-lg font-semibold mb-2">Precise Removal</h3>
              <p className="text-sm text-gray-400">
                Advanced AI detects subjects and removes backgrounds with pixel-perfect accuracy
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold mb-2">Fast Processing</h3>
              <p className="text-sm text-gray-400">
                Get results in 10-15 seconds with our optimized BRIA RMBG 2.0 model
              </p>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-lg font-semibold mb-2">Transparent PNG</h3>
              <p className="text-sm text-gray-400">
                Download high-quality PNG images with transparent backgrounds
              </p>
            </div>
          </div>

          {/* Use Cases */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 p-6">
            <h3 className="text-xl font-semibold mb-4">Perfect for:</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <div className="font-medium">E-commerce Products</div>
                  <div className="text-sm text-gray-400">Clean product photos for online stores</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <div className="font-medium">Profile Pictures</div>
                  <div className="text-sm text-gray-400">Professional headshots with clean backgrounds</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <div className="font-medium">Marketing Materials</div>
                  <div className="text-sm text-gray-400">Isolated images for designs and presentations</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-green-400 mt-1">✓</div>
                <div>
                  <div className="font-medium">Social Media Content</div>
                  <div className="text-sm text-gray-400">Eye-catching posts with transparent backgrounds</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToolsLayout>
      <Footer />
    </>
  );
}
