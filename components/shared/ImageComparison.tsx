"use client";

import Image from "next/image";

/**
 * Before/After image comparison component
 * Used by: Upscaler, BackgroundRemover, ImageExpander
 */

export interface ImageComparisonProps {
  originalUrl: string;
  processedUrl: string;
  originalLabel?: string;
  processedLabel?: string;
  accentColor?: 'green' | 'blue' | 'purple';
  aspectRatio?: 'square' | 'video' | 'auto';
}

const COLOR_CLASSES = {
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
};

const ASPECT_CLASSES = {
  square: 'aspect-square',
  video: 'aspect-video',
  auto: 'aspect-auto min-h-[300px]',
};

export default function ImageComparison({
  originalUrl,
  processedUrl,
  originalLabel = "Original",
  processedLabel = "Processed",
  accentColor = 'green',
  aspectRatio = 'square',
}: ImageComparisonProps) {
  const dotColor = COLOR_CLASSES[accentColor];
  const aspect = ASPECT_CLASSES[aspectRatio];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Original */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          {originalLabel}
        </h4>
        <div className={`relative ${aspect} rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
          <Image
            src={originalUrl}
            alt={originalLabel}
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Processed */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <span className={`w-2 h-2 ${dotColor} rounded-full`}></span>
          {processedLabel}
        </h4>
        <div className={`relative ${aspect} rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
          <Image
            src={processedUrl}
            alt={processedLabel}
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
