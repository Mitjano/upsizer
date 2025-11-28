'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import ToolsLayout from '@/components/ToolsLayout';
import ObjectRemover from '@/components/ObjectRemover';

export default function ObjectRemovalPage() {
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
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              AI Object Removal
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Remove unwanted objects, people, text, or any distractions from your photos with BRIA Eraser AI.
            Simply brush over what you want to remove and let AI fill in the background naturally.
          </p>

          {credits !== undefined && (
            <div className="mt-4 inline-flex items-center gap-2 bg-orange-900/30 border border-orange-800 rounded-full px-4 py-2">
              <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-orange-200">
                {credits} credits remaining (2 credits per removal)
              </span>
            </div>
          )}
        </div>

        {/* Object Remover Component */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <ObjectRemover />
          <p className="text-sm text-gray-500 mt-4 text-center">
            By uploading a file you agree to our Terms of Use and Privacy Policy.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Precise Removal</h3>
            <p className="text-sm text-gray-400">
              Draw over exactly what you want to remove with adjustable brush size
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">🖼️</div>
            <h3 className="text-lg font-semibold mb-2">Natural Infill</h3>
            <p className="text-sm text-gray-400">
              AI intelligently fills the removed area to match surrounding content
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Quick Results</h3>
            <p className="text-sm text-gray-400">
              Process images in seconds with professional-quality results
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How to Remove Objects</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-400 font-bold text-xl">1</span>
              </div>
              <h3 className="font-semibold mb-2">Upload Image</h3>
              <p className="text-sm text-gray-400">
                Upload the photo containing objects you want to remove
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-400 font-bold text-xl">2</span>
              </div>
              <h3 className="font-semibold mb-2">Brush Over Object</h3>
              <p className="text-sm text-gray-400">
                Use the brush tool to paint over what you want removed
              </p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-orange-400 font-bold text-xl">3</span>
              </div>
              <h3 className="font-semibold mb-2">Download Result</h3>
              <p className="text-sm text-gray-400">
                AI removes the object and fills the space naturally
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold mb-2">Remove People</h3>
            <p className="text-sm text-gray-400 mb-3">
              Remove photobombers, tourists, or unwanted people from your photos.
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-lg font-semibold mb-2">Remove Text & Watermarks</h3>
            <p className="text-sm text-gray-400 mb-3">
              Clean up images by removing text overlays, logos, or watermarks.
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-xl border border-gray-700 p-6">
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="text-lg font-semibold mb-2">Remove Distractions</h3>
            <p className="text-sm text-gray-400 mb-3">
              Clean up photos by removing trash, wires, signs, or other distractions.
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-800/20 rounded-xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold mb-4">Tips for Best Results</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-400">
            <div>
              <h4 className="font-semibold text-white mb-2">Best Practices:</h4>
              <ul className="space-y-2 text-sm">
                <li>Cover the entire object you want to remove</li>
                <li>Include a small margin around the object</li>
                <li>Works best with simpler backgrounds</li>
                <li>Use larger brush for bigger objects</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">Pro Tips:</h4>
              <ul className="space-y-2 text-sm">
                <li>Remove objects one at a time for complex edits</li>
                <li>Smaller objects generally remove more cleanly</li>
                <li>Textured backgrounds (grass, water) infill well</li>
                <li>Use Undo to correct brush strokes before processing</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolsLayout>
  );
}
