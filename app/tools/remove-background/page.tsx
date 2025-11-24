'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ToolsLayout from '@/components/ToolsLayout';
import { BackgroundRemover } from '@/components/BackgroundRemover';
import { ProcessedImagesGallery } from '@/components/ProcessedImagesGallery';

export default function RemoveBackgroundPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'user' | 'premium' | 'admin'>('user');
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/tools/remove-background');
    }
  }, [status, router]);

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

          {/* SEO Content Section */}
          <div className="mt-16 bg-gray-800/20 rounded-xl border border-gray-700 p-8">
            <h2 className="text-2xl font-bold mb-4">
              Professional Background Removal for Every Use Case
            </h2>
            <div className="space-y-4 text-gray-400">
              <p>
                Our AI-powered background remover uses the state-of-the-art BRIA RMBG 2.0 model to deliver
                professional-quality results in seconds. Whether you're preparing product photos for your
                e-commerce store, creating profile pictures, or working on graphic design projects, our tool
                handles it all with precision.
              </p>
              <p>
                <strong className="text-white">Perfect for:</strong> E-commerce product photography,
                social media content creation, marketing materials, profile pictures, graphic design,
                real estate listings, and professional portfolios.
              </p>
              <p>
                <strong className="text-white">Key benefits:</strong> No manual masking required,
                instant results, high-quality edge detection, transparent PNG output, and support for
                multiple resolutions. Free users get low-resolution PNG downloads, while premium members
                can download in original resolution and convert to JPG format.
              </p>
            </div>
          </div>
        </div>
      </ToolsLayout>
    </>
  );
}
