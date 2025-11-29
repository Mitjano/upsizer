'use client';

import { useState, useRef, useEffect } from 'react';
import { getModelsForMode, type AIImageMode, type AIModel } from '@/lib/ai-image/models';

interface ModelSelectorProps {
  mode: AIImageMode;
  value: string;
  onChange: (modelId: string) => void;
}

export default function ModelSelector({ mode, value, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableModels = getModelsForMode(mode);
  const selectedModel = availableModels.find(m => m.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleModelSelect = (model: AIModel) => {
    onChange(model.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Model
      </label>

      {/* Selected Model Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white text-left hover:bg-gray-600 transition"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate font-medium">{selectedModel?.name || 'Select Model'}</span>
            {selectedModel?.isNew && (
              <span className="px-1.5 py-0.5 bg-green-600/30 text-green-400 text-[10px] font-semibold rounded">NEW</span>
            )}
            {selectedModel?.isPopular && (
              <span className="px-1.5 py-0.5 bg-amber-600/30 text-amber-400 text-[10px] font-semibold rounded">HOT</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 ml-2">
            <span>{selectedModel?.credits || 0} credits</span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Features Tags */}
      {selectedModel?.features && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedModel.features.slice(0, 3).map((feature, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs rounded-full"
            >
              {feature}
            </span>
          ))}
        </div>
      )}

      {/* Dropdown - All models in a simple list */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-visible">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {availableModels.map((model) => (
              <button
                key={model.id}
                onClick={() => handleModelSelect(model)}
                className={`w-full p-3 rounded-lg text-left transition mb-1 last:mb-0 ${
                  value === model.id
                    ? 'bg-purple-600/20 border border-purple-500'
                    : 'bg-gray-700/30 border border-transparent hover:bg-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-white text-sm">{model.name}</span>
                    {model.isNew && (
                      <span className="px-1.5 py-0.5 bg-green-600/30 text-green-400 text-[10px] font-semibold rounded">NEW</span>
                    )}
                    {model.isPopular && (
                      <span className="px-1.5 py-0.5 bg-amber-600/30 text-amber-400 text-[10px] font-semibold rounded">HOT</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-purple-400 font-semibold text-sm">{model.credits}</span>
                    <span className="text-gray-500 text-xs">cr</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
