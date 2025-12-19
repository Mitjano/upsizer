'use client';

import { useSession } from 'next-auth/react';
import { useState, useRef, useCallback } from 'react';
import { CreditCostBadge } from './shared';
import { useAnalytics } from '@/hooks/useAnalytics';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Preset aspect ratios
const ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '2:3', value: 2 / 3 },
  { label: '3:2', value: 3 / 2 },
];

export default function CropImage() {
  const { data: session } = useSession();
  const { trackImageUploaded, trackImageDownloaded } = useAnalytics();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setCroppedImage(null);

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB');
      return;
    }

    trackImageUploaded(file.size, file.type);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setOriginalImage(result);

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        setCropArea({ x: 0, y: 0, width: img.width, height: img.height });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = async () => {
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
      formData.append('x', Math.round(cropArea.x).toString());
      formData.append('y', Math.round(cropArea.y).toString());
      formData.append('width', Math.round(cropArea.width).toString());
      formData.append('height', Math.round(cropArea.height).toString());

      const res = await fetch('/api/crop-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to crop image');
      }

      setCroppedImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to crop image');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!croppedImage) return;
    const link = document.createElement('a');
    link.href = croppedImage;
    link.download = `cropped-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trackImageDownloaded('crop');
  };

  const reset = () => {
    setOriginalImage(null);
    setCroppedImage(null);
    setError(null);
    setCropArea({ x: 0, y: 0, width: 100, height: 100 });
  };

  const handleAspectRatioChange = (ratio: number | null) => {
    setAspectRatio(ratio);
    if (ratio && imageDimensions.width > 0) {
      const maxWidth = imageDimensions.width;
      const maxHeight = imageDimensions.height;
      let newWidth = maxWidth;
      let newHeight = newWidth / ratio;

      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * ratio;
      }

      setCropArea({
        x: (maxWidth - newWidth) / 2,
        y: (maxHeight - newHeight) / 2,
        width: newWidth,
        height: newHeight,
      });
    }
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
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Sign in to Crop Images</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start cropping your images. This tool is completely free!
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
          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Click or drag image to crop</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">JPG, PNG, WebP up to 20MB</p>
          <CreditCostBadge tool="crop_image" size="md" />
        </div>
      ) : (
        <div>
          {/* Aspect Ratio Selector */}
          <div className="mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Aspect Ratio</h3>
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.label}
                  onClick={() => handleAspectRatioChange(ratio.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    aspectRatio === ratio.value
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>

            {/* Manual crop inputs */}
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">X</label>
                <input
                  type="number"
                  value={Math.round(cropArea.x)}
                  onChange={(e) => setCropArea({ ...cropArea, x: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Y</label>
                <input
                  type="number"
                  value={Math.round(cropArea.y)}
                  onChange={(e) => setCropArea({ ...cropArea, y: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Width</label>
                <input
                  type="number"
                  value={Math.round(cropArea.width)}
                  onChange={(e) => setCropArea({ ...cropArea, width: parseInt(e.target.value) || 100 })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Height</label>
                <input
                  type="number"
                  value={Math.round(cropArea.height)}
                  onChange={(e) => setCropArea({ ...cropArea, height: parseInt(e.target.value) || 100 })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleCrop}
                disabled={loading}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-lg font-medium transition text-white"
              >
                {loading ? 'Cropping...' : 'Crop Image'}
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

          {/* Image Preview */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Original ({imageDimensions.width}x{imageDimensions.height})</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                <img ref={imageRef} src={originalImage} alt="Original" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Cropped Preview</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                {croppedImage ? (
                  <img src={croppedImage} alt="Cropped" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    {loading ? 'Processing...' : 'Click "Crop Image" to preview'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {croppedImage && (
            <div className="mt-6">
              <button
                onClick={downloadImage}
                className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition text-white"
              >
                Download Cropped Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
