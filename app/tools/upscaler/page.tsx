'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ToolsLayout from '@/components/ToolsLayout';
import EnhancedImageUploader from '@/components/EnhancedImageUploader';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function UpscalerPage() {
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
          <div className="grid md:grid-cols-3 gap-6 mb-8">
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
        </div>
      </ToolsLayout>
      <Footer />
    </>
  );
}
