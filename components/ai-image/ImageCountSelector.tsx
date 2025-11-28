'use client';

import { IMAGE_COUNT_OPTIONS, type ImageCount } from '@/lib/ai-image/models';

interface ImageCountSelectorProps {
  value: ImageCount;
  onChange: (count: ImageCount) => void;
  creditsPerImage: number;
}

export default function ImageCountSelector({
  value,
  onChange,
  creditsPerImage,
}: ImageCountSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Number of Images
      </label>
      <div className="flex gap-2">
        {IMAGE_COUNT_OPTIONS.map((count) => (
          <button
            key={count}
            onClick={() => onChange(count)}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              value === count
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
            }`}
          >
            {count}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1 text-center">
        Total: {creditsPerImage * value} credits
      </p>
    </div>
  );
}
