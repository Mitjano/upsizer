'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  quality: number;
  width: number;
  height: number;
}

export default function ImageCompressor() {
  const { data: session } = useSession();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  // Compression settings
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('auto'); // 'auto', 'jpg', 'png', 'webp'

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset state
    setError(null);
    setCompressedImage(null);
    setStats(null);

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Show original image
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCompress = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);
    setProgress('Compressing image...');

    try {
      // Convert data URL back to file
      const response = await fetch(originalImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');
      formData.append('quality', quality.toString());
      formData.append('format', format);

      setProgress('Processing with AI...');

      const res = await fetch('/api/compress-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to compress image');
      }

      setCompressedImage(data.image);
      setStats(data.stats);
      setProgress('');

    } catch (err) {
      console.error('Compression error:', err);
      setError(err instanceof Error ? err.message : 'Failed to compress image');
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!compressedImage) return;

    const link = document.createElement('a');
    link.href = compressedImage;
    link.download = `compressed-${Date.now()}.${stats?.format || 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setOriginalImage(null);
    setCompressedImage(null);
    setStats(null);
    setError(null);
    setProgress('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Show login prompt for unauthenticated users
  if (!session) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative border-2 border-dashed border-gray-600 rounded-2xl p-12 bg-gray-800/30">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-500"
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
            <h3 className="text-2xl font-bold mb-3">Sign in to Compress Images</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start compressing your images. Get 3 free credits to try it out!
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/auth/signin"
                className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition"
              >
                Sign In
              </a>
              <a
                href="/auth/signup"
                className="inline-block px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
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
        <div className="relative border-2 border-dashed border-gray-600 rounded-2xl p-12 text-center hover:border-green-500 transition-colors bg-gray-800/30">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Click or drag image to compress</p>
          <p className="text-sm text-gray-400">JPG, PNG, WebP up to 10MB</p>
        </div>
      ) : (
        <div>
          {/* Settings Panel */}
          <div className="mb-6 bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Compression Settings</h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Quality Slider */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>
              </div>

              {/* Format Selector */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Output Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  disabled={loading}
                >
                  <option value="auto">Auto (Recommended)</option>
                  <option value="jpg">JPG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleCompress}
                disabled={loading}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-lg font-medium transition"
              >
                {loading ? 'Compressing...' : 'Compress Image'}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
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
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Original</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Compressed */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Compressed</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
                {compressedImage ? (
                  <img
                    src={compressedImage}
                    alt="Compressed"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    {loading ? 'Processing...' : 'Click "Compress Image" to start'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Compression Results</h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Original Size</p>
                  <p className="text-xl font-bold">{formatFileSize(stats.originalSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Compressed Size</p>
                  <p className="text-xl font-bold text-green-400">{formatFileSize(stats.compressedSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Space Saved</p>
                  <p className="text-xl font-bold text-green-400">{stats.compressionRatio}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Format</p>
                  <p className="text-xl font-bold uppercase">{stats.format}</p>
                </div>
              </div>

              <button
                onClick={downloadImage}
                className="mt-6 w-full px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition"
              >
                Download Compressed Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
