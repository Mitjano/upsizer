'use client';

import { ASPECT_RATIOS } from '@/lib/ai-image/models';

interface AspectRatioSelectorProps {
  value: string;
  onChange: (ratio: string) => void;
}

export default function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Aspect Ratio
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1.25rem',
        }}
      >
        {ASPECT_RATIOS.map((ratio) => (
          <option key={ratio.id} value={ratio.id}>
            {ratio.name} ({ratio.ratio})
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        {ASPECT_RATIOS.find(ar => ar.id === value)?.description}
      </p>
    </div>
  );
}
