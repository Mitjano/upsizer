'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { CreditCostBadge } from './shared';
import { useAnalytics } from '@/hooks/useAnalytics';

// Filter presets
const FILTER_PRESETS = [
  { label: 'None', value: 'none' },
  { label: 'Grayscale', value: 'grayscale' },
  { label: 'Sepia', value: 'sepia' },
  { label: 'Vintage', value: 'vintage' },
  { label: 'Cool', value: 'cool' },
  { label: 'Warm', value: 'warm' },
  { label: 'Dramatic', value: 'dramatic' },
];

export default function ImageFilters() {
  const { data: session } = useSession();
  const { trackImageUploaded, trackImageDownloaded } = useAnalytics();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [filteredImage, setFilteredImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  // Filter settings
  const [preset, setPreset] = useState('none');
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [blur, setBlur] = useState(0);
  const [sharpen, setSharpen] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Reset state
    setError(null);
    setFilteredImage(null);

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
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyFilters = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);
    setProgress('Applying filters...');

    try {
      // Convert data URL to blob without using fetch (CSP-safe)
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
      formData.append('preset', preset);
      formData.append('brightness', brightness.toString());
      formData.append('contrast', contrast.toString());
      formData.append('saturation', saturation.toString());
      formData.append('blur', blur.toString());
      formData.append('sharpen', sharpen.toString());

      setProgress('Processing with AI...');

      const res = await fetch('/api/image-filters', {
        method: 'POST',
        body: formData,
      });

      // Handle non-JSON responses (like HTML error pages)
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server error. Please try again.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply filters');
      }

      setFilteredImage(data.image);
      setProgress('');

    } catch (err) {
      console.error('Filter error:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to apply filters');
      }
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!filteredImage) return;

    const link = document.createElement('a');
    link.href = filteredImage;
    link.download = `filtered-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Track download
    trackImageDownloaded('filters');
  };

  const reset = () => {
    setOriginalImage(null);
    setFilteredImage(null);
    setError(null);
    setProgress('');
  };

  const resetFilters = () => {
    setPreset('none');
    setBrightness(1);
    setContrast(1);
    setSaturation(1);
    setBlur(0);
    setSharpen(0);
    setFilteredImage(null);
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
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Sign in to Apply Image Filters</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start applying filters to your images. Get 3 free credits to try it out!
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
          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Click or drag image to apply filters</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">JPG, PNG, WebP up to 20MB</p>
          <CreditCostBadge tool="image_filters" size="md" />
        </div>
      ) : (
        <div>
          {/* Filter Settings Panel */}
          <div className="mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter Settings</h3>

            {/* Preset Filters */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Preset Filter
              </label>
              <div className="flex flex-wrap gap-2">
                {FILTER_PRESETS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setPreset(filter.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      preset === filter.value
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    disabled={loading}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Adjustment Sliders */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Brightness Slider */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Brightness: {brightness.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>Darker</span>
                  <span>Brighter</span>
                </div>
              </div>

              {/* Contrast Slider */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Contrast: {contrast.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>Lower</span>
                  <span>Higher</span>
                </div>
              </div>

              {/* Saturation Slider */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Saturation: {saturation.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={saturation}
                  onChange={(e) => setSaturation(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>Grayscale</span>
                  <span>Vibrant</span>
                </div>
              </div>

              {/* Blur Slider */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Blur: {blur.toFixed(0)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={blur}
                  onChange={(e) => setBlur(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>Sharp</span>
                  <span>Blurred</span>
                </div>
              </div>

              {/* Sharpen Slider */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Sharpen: {sharpen.toFixed(0)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={sharpen}
                  onChange={(e) => setSharpen(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>Normal</span>
                  <span>Sharpened</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                {loading ? 'Applying Filters...' : 'Apply Filters'}
              </button>
              <button
                onClick={resetFilters}
                disabled={loading}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Reset Filters
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
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Original</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Filtered */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filtered</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                {filteredImage ? (
                  <img
                    src={filteredImage}
                    alt="Filtered"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-500">
                    {loading ? 'Processing...' : 'Click "Apply Filters" to see result'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Download Button */}
          {filteredImage && (
            <div className="mt-6">
              <button
                onClick={downloadImage}
                className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Download Filtered Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
