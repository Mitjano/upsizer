'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { CreditCostBadge } from './shared';
import { useAnalytics } from '@/hooks/useAnalytics';

const COLOR_MODES = [
  { id: 'color', label: 'Full Color', emoji: '🌈' },
  { id: 'grayscale', label: 'Grayscale', emoji: '⬜' },
  { id: 'bw', label: 'Black & White', emoji: '⬛' },
];

export default function Vectorize() {
  const { data: session } = useSession();
  const { trackImageUploaded, trackImageDownloaded } = useAnalytics();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colorMode, setColorMode] = useState('color');
  const [maxColors, setMaxColors] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSvgResult(null);

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, WebP, GIF, or BMP image');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    trackImageUploaded(file.size, file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleVectorize = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);

    try {
      const mimeMatch = originalImage.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const base64Data = originalImage.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });

      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');
      formData.append('mode', 'production');
      formData.append('colorMode', colorMode);
      if (maxColors > 0) {
        formData.append('maxColors', maxColors.toString());
      }

      const res = await fetch('/api/vectorize', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to vectorize image');
      }

      setSvgResult(data.svg);
      setCreditsRemaining(data.creditsRemaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to vectorize image');
    } finally {
      setLoading(false);
    }
  };

  const downloadSvg = () => {
    if (!svgResult) return;
    const blob = new Blob([svgResult], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vector-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    trackImageDownloaded('vectorize');
  };

  const reset = () => {
    setOriginalImage(null);
    setSvgResult(null);
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
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Sign in to Vectorize Images</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to convert images to SVG. Each conversion costs 3 credits.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/auth/signin" className="px-8 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-medium transition text-white">Sign In</a>
              <a href="/auth/signup" className="px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white">Sign Up Free</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {!originalImage ? (
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-teal-500 transition-colors bg-gray-100 dark:bg-gray-800/30">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Click or drag image to vectorize</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">JPG, PNG, WebP, GIF, BMP up to 10MB</p>
          <CreditCostBadge tool="vectorize" size="md" />
        </div>
      ) : (
        <div>
          {/* Settings */}
          <div className="mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Vectorization Settings</h3>

            {/* Color Mode */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Color Mode</label>
              <div className="flex gap-3">
                {COLOR_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setColorMode(mode.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      colorMode === mode.id
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span>{mode.emoji}</span>
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Max Colors */}
            {colorMode === 'color' && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Max Colors ({maxColors === 0 ? 'Unlimited' : maxColors})
                </label>
                <input
                  type="range"
                  min="0"
                  max="256"
                  step="8"
                  value={maxColors}
                  onChange={(e) => setMaxColors(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Unlimited</span>
                  <span>256 colors</span>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleVectorize}
                disabled={loading}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-600 rounded-lg font-medium transition text-white flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Converting...
                  </>
                ) : (
                  'Convert to SVG'
                )}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Upload New Image
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Preview */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Original (Raster)</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900 p-4">
                <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vectorized (SVG)</h3>
                {creditsRemaining !== null && (
                  <span className="text-sm text-gray-500">{creditsRemaining} credits</span>
                )}
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900 p-4">
                {svgResult ? (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: svgResult }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    {loading ? 'Converting...' : 'Click "Convert to SVG" to start'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {svgResult && (
            <div className="mt-6">
              <button
                onClick={downloadSvg}
                className="w-full px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-medium transition text-white"
              >
                Download SVG
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
