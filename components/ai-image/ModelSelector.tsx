'use client';

import { AI_MODELS, getModelsForMode, type AIImageMode } from '@/lib/ai-image/models';

interface ModelSelectorProps {
  mode: AIImageMode;
  value: string;
  onChange: (modelId: string) => void;
}

export default function ModelSelector({ mode, value, onChange }: ModelSelectorProps) {
  const availableModels = getModelsForMode(mode);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Model
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
        {availableModels.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name} ({model.credits} {model.credits === 1 ? 'credit' : 'credits'})
          </option>
        ))}
      </select>
      {availableModels.find(m => m.id === value)?.features && (
        <div className="flex flex-wrap gap-1 mt-2">
          {availableModels.find(m => m.id === value)?.features.map((feature, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
