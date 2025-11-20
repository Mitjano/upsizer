'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';

export default function BackgroundRemover() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image (JPG, PNG, or WebP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setProcessedImage(null);

    // Preview original
    const reader = new FileReader();
    reader.onload = (e) => setOriginalImage(e.target?.result as string);
    reader.readAsDataURL(file);

    // Process
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedImage(url);
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, []);

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'removed-background.png';
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-purple-500 bg-purple-500/10'
            : 'border-gray-700 hover:border-purple-500 hover:bg-gray-800/50'
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={onFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {isDragActive ? 'Drop image here' : 'Drag & drop an image here'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                or click to browse (JPG, PNG, WebP up to 10MB)
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Processing */}
      {isProcessing && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500/30 border-t-purple-500"></div>
          <p className="mt-4 text-gray-400 font-medium">Removing background with AI...</p>
          <p className="text-sm text-gray-500 mt-2">This usually takes 10-15 seconds</p>
        </div>
      )}

      {/* Results */}
      {(originalImage || processedImage) && !isProcessing && (
        <div className="grid md:grid-cols-2 gap-8">
          {originalImage && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Original Image</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
                <Image src={originalImage} alt="Original" fill className="object-contain" />
              </div>
            </div>
          )}
          {processedImage && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Background Removed</h3>
              <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-700 bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937),linear-gradient(45deg,#1f2937_25%,transparent_25%,transparent_75%,#1f2937_75%,#1f2937)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
                <Image src={processedImage} alt="Processed" fill className="object-contain" />
              </div>
              <button
                onClick={downloadImage}
                className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Download Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
