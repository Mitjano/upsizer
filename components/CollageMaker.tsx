'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { CreditCostBadge } from './shared';
import { useAnalytics } from '@/hooks/useAnalytics';

const LAYOUTS = [
  { id: '2x1', label: '2 Horizontal', cols: 2, rows: 1, minImages: 2 },
  { id: '1x2', label: '2 Vertical', cols: 1, rows: 2, minImages: 2 },
  { id: '2x2', label: '2x2 Grid', cols: 2, rows: 2, minImages: 4 },
  { id: '3x3', label: '3x3 Grid', cols: 3, rows: 3, minImages: 9 },
  { id: '1+2', label: '1 + 2 Below', cols: 2, rows: 2, minImages: 3 },
  { id: '2+1', label: '2 + 1 Below', cols: 2, rows: 2, minImages: 3 },
];

export default function CollageMaker() {
  const { data: session } = useSession();
  const { trackImageUploaded, trackImageDownloaded } = useAnalytics();
  const [images, setImages] = useState<string[]>([]);
  const [collageImage, setCollageImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState('2x2');
  const [gap, setGap] = useState(10);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [outputWidth, setOutputWidth] = useState(1200);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setCollageImage(null);

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) return false;
      if (file.size > 10 * 1024 * 1024) return false;
      return true;
    });

    if (validFiles.length === 0) {
      setError('Please upload valid JPG, PNG, or WebP images (max 10MB each)');
      return;
    }

    validFiles.forEach(file => trackImageUploaded(file.size, file.type));

    // Read all files
    Promise.all(
      validFiles.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      }))
    ).then(results => {
      setImages(prev => [...prev, ...results].slice(0, 9));
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateCollage = async () => {
    if (images.length < 2) {
      setError('Please add at least 2 images');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/collage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          layout,
          gap,
          backgroundColor,
          outputWidth,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create collage');
      }

      setCollageImage(data.collage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collage');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!collageImage) return;
    const link = document.createElement('a');
    link.href = collageImage;
    link.download = `collage-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trackImageDownloaded('collage');
  };

  const reset = () => {
    setImages([]);
    setCollageImage(null);
    setError(null);
  };

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 bg-gray-100 dark:bg-gray-800/30">
          <div className="text-center">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Sign in to Create Collages</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start making photo collages. This tool is completely free!
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/auth/signin" className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition text-white">Sign In</a>
              <a href="/auth/signup" className="px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white">Sign Up Free</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Upload Section */}
      <div className="mb-6">
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:border-orange-500 transition-colors bg-gray-100 dark:bg-gray-800/30">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            multiple
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Click or drag images to add ({images.length}/9)</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">JPG, PNG, WebP - Add 2-9 images</p>
          <CreditCostBadge tool="collage" size="md" />
        </div>
      </div>

      {/* Images Preview */}
      {images.length > 0 && (
        <div className="mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Your Images ({images.length})</h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img src={img} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
                <div className="absolute bottom-1 left-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      {images.length >= 2 && (
        <div className="mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Collage Settings</h3>

          {/* Layout Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Layout</label>
            <div className="flex flex-wrap gap-2">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLayout(l.id)}
                  disabled={images.length < l.minImages}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    layout === l.id
                      ? 'bg-orange-500 text-white'
                      : images.length < l.minImages
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {l.label} ({l.minImages}+)
                </button>
              ))}
            </div>
          </div>

          {/* Other Settings */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Gap (px)</label>
              <input
                type="range"
                min="0"
                max="50"
                value={gap}
                onChange={(e) => setGap(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-500">{gap}px</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Background Color</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Output Width</label>
              <select
                value={outputWidth}
                onChange={(e) => setOutputWidth(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value={800}>800px</option>
                <option value={1200}>1200px</option>
                <option value={1600}>1600px</option>
                <option value={2000}>2000px</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={handleCreateCollage}
              disabled={loading || images.length < 2}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 rounded-lg font-medium transition text-white"
            >
              {loading ? 'Creating...' : 'Create Collage'}
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Result */}
      {collageImage && (
        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Your Collage</h3>
          <div className="rounded-lg overflow-hidden bg-white dark:bg-gray-900 mb-4">
            <img src={collageImage} alt="Collage" className="w-full h-auto" />
          </div>
          <button
            onClick={downloadImage}
            className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition text-white"
          >
            Download Collage
          </button>
        </div>
      )}
    </div>
  );
}
