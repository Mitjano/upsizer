'use client';

import { useState, useRef, useEffect } from 'react';
import { IMAGE_STYLES } from '@/lib/ai-image/styles';

interface StyleSelectorProps {
  value: string;
  onChange: (styleId: string) => void;
}

export default function StyleSelector({ value, onChange }: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedStyle = IMAGE_STYLES.find(s => s.id === value) || IMAGE_STYLES[0];

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

  const handleStyleSelect = (styleId: string) => {
    onChange(styleId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Style
      </label>

      {/* Selected Style Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white text-left flex items-center justify-between hover:bg-gray-600 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{selectedStyle.icon}</span>
          <span className="truncate font-medium">{selectedStyle.name}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Style Preview (description) */}
      {selectedStyle.id !== 'none' && (
        <p className="mt-1.5 text-xs text-gray-500 line-clamp-1">
          {selectedStyle.description}
        </p>
      )}

      {/* Dropdown - All styles in a simple list */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-visible">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {IMAGE_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`w-full p-3 rounded-lg text-left transition mb-1 last:mb-0 ${
                  value === style.id
                    ? 'bg-orange-600/20 border border-orange-500'
                    : 'bg-gray-700/30 border border-transparent hover:bg-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{style.icon}</span>
                  <span className="font-semibold text-white text-sm">{style.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
