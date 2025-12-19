'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { CreditCostBadge } from './shared';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ResizeResult {
  width: number;
  height: number;
}

// Preset sizes
const PRESET_SIZES = [
  { label: '1080x1080', width: 1080, height: 1080 },
  { label: '1920x1080', width: 1920, height: 1080 },
  { label: '1280x720', width: 1280, height: 720 },
  { label: '800x600', width: 800, height: 600 },
  { label: 'Custom', width: null, height: null },
];

// Fit modes
const FIT_MODES = [
  { label: 'Cover', value: 'cover', description: 'Fill entire area, may crop' },
  { label: 'Contain', value: 'contain', description: 'Fit inside, no crop' },
  { label: 'Fill', value: 'fill', description: 'Stretch to fill exactly' },
];

export default function ResizeImage() {
  const { data: session } = useSession();
  const { trackImageUploaded, trackImageDownloaded } = useAnalytics();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resizedImage, setResizedImage] = useState<string | null>(null);
  const [resizeResult, setResizeResult] = useState<ResizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  // Resize settings
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [fit, setFit] = useState('cover');
  const [selectedPreset, setSelectedPreset] = useState('1080x1080');
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Reset state
    setError(null);
    setResizedImage(null);
    setResizeResult(null);

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
      return;
    }

    // Track upload
    trackImageUploaded(file.size, file.type);

    // Show original image
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setOriginalImage(result);

      // Get original dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
      };
      img.src = result;
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (preset: typeof PRESET_SIZES[0]) => {
    setSelectedPreset(preset.label);
    if (preset.width && preset.height) {
      setWidth(preset.width);
      setHeight(preset.height);
    }
  };

  const handleResize = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);
    setProgress('Resizing image...');

    try {
      // Convert data URL to blob
      const mimeMatch = originalImage.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      // Decode base64 to binary
      const base64Data = originalImage.split(',')[1];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });

      // Determine file extension from MIME type
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };
      const ext = extMap[mimeType] || 'jpg';

      const formData = new FormData();
      formData.append('file', blob, `image.${ext}`);
      formData.append('width', width.toString());
      formData.append('height', height.toString());
      formData.append('fit', fit);

      setProgress('Processing with AI...');

      const res = await fetch('/api/resize-image', {
        method: 'POST',
        body: formData,
      });

      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server error. Please try again.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resize image');
      }

      setResizedImage(data.image);
      setResizeResult({
        width: data.width,
        height: data.height,
      });
      setProgress('');

    } catch (err) {
      console.error('Resize error:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to resize image');
      }
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!resizedImage) return;

    const link = document.createElement('a');
    link.href = resizedImage;
    link.download = `resized-${width}x${height}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Track download
    trackImageDownloaded('resize');
  };

  const reset = () => {
    setOriginalImage(null);
    setResizedImage(null);
    setResizeResult(null);
    setError(null);
    setProgress('');
  };

  // Show login prompt for unauthenticated users
  if (!session) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 bg-gray-100 dark:bg-gray-800/30">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-500 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Sign in to Resize Images</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start resizing your images. Get 3 free credits to try it out!
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/auth/signin"
                className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Sign In
              </a>
              <a
                href="/auth/signup"
                className="inline-block px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Sign Up Free
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {!originalImage ? (
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-green-500 transition-colors bg-gray-100 dark:bg-gray-800/30">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Click or drag image to resize</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">JPG, PNG, WebP up to 20MB</p>
          <CreditCostBadge tool="resize_image" size="md" />
        </div>
      ) : (
        <div>
          {/* Settings Panel */}
          <div className="mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Resize Settings</h3>

            {/* Preset Sizes */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Preset Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SIZES.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetSelect(preset)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedPreset === preset.label
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    disabled={loading}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Width and Height Inputs */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={width}
                  onChange={(e) => {
                    setWidth(parseInt(e.target.value) || 1);
                    setSelectedPreset('Custom');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={height}
                  onChange={(e) => {
                    setHeight(parseInt(e.target.value) || 1);
                    setSelectedPreset('Custom');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Fit Mode Selector */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Fit Mode
              </label>
              <div className="grid md:grid-cols-3 gap-3">
                {FIT_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setFit(mode.value)}
                    className={`p-4 rounded-lg border-2 transition ${
                      fit === mode.value
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500/50'
                    }`}
                    disabled={loading}
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-1">{mode.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleResize}
                disabled={loading}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                {loading ? 'Resizing...' : 'Resize Image'}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Upload New Image
              </button>
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
              <p className="text-blue-400">{progress}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Original {originalDimensions.width > 0 && `(${originalDimensions.width}x${originalDimensions.height})`}
              </h3>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Resized */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Resized {resizeResult && `(${resizeResult.width}x${resizeResult.height})`}
              </h3>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                {resizedImage ? (
                  <img
                    src={resizedImage}
                    alt="Resized"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-500">
                    {loading ? 'Processing...' : 'Click "Resize Image" to start'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Download Button */}
          {resizedImage && (
            <div className="mt-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <button
                onClick={downloadImage}
                className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Download Resized Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
