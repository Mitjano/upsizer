'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  icon?: ReactNode;
}

interface EmptyStateProps {
  icon?: ReactNode | string;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  suggestions?: string[];
  className?: string;
}

// Preset empty states for common scenarios
export const emptyStatePresets = {
  noImages: {
    icon: '📷',
    title: 'No images yet',
    description: 'Upload your first image to get started with AI enhancement',
    actions: [
      { label: 'Upload Image', href: '/tools/upscaler', variant: 'primary' as const },
    ],
  },
  noActivity: {
    icon: '📂',
    title: 'No activity yet',
    description: 'Start using our tools to see your processing history here',
    actions: [
      { label: 'Try Upscaler', href: '/tools/upscaler', variant: 'primary' as const },
      { label: 'Try Background Remover', href: '/tools/remove-background', variant: 'secondary' as const },
    ],
  },
  noResults: {
    icon: '🔍',
    title: 'No results found',
    description: "We couldn't find what you're looking for. Try adjusting your search.",
    actions: [],
  },
  noCredits: {
    icon: '💎',
    title: 'Out of credits',
    description: "You've used all your credits. Get more to continue processing images.",
    actions: [
      { label: 'Get More Credits', href: '/pricing', variant: 'primary' as const },
    ],
  },
  uploadFirst: {
    icon: '⬆️',
    title: 'Upload an image to begin',
    description: 'Drag and drop an image or click to browse your files',
    actions: [],
    suggestions: [
      'Supported formats: JPG, PNG, WebP',
      'Maximum file size: 30MB',
      'Best results with high-quality images',
    ],
  },
  selectPreset: {
    icon: '🎯',
    title: 'Choose your enhancement',
    description: 'Select a preset to customize how your image will be processed',
    actions: [],
  },
  error: {
    icon: '⚠️',
    title: 'Something went wrong',
    description: 'An error occurred while processing your request. Please try again.',
    actions: [
      { label: 'Try Again', variant: 'primary' as const },
    ],
  },
};

export default function EmptyState({
  icon,
  title,
  description,
  actions = [],
  suggestions,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      {/* Icon */}
      {icon && (
        <div className="mb-6">
          {typeof icon === 'string' ? (
            <span className="text-6xl block animate-bounce-slow">{icon}</span>
          ) : (
            <div className="w-16 h-16 text-gray-400">{icon}</div>
          )}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>

      {/* Description */}
      <p className="text-gray-400 max-w-md mb-6">{description}</p>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="mb-6 space-y-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center">
          {actions.map((action, index) => {
            const buttonClasses =
              action.variant === 'primary'
                ? 'px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white rounded-lg font-medium transition-all hover:scale-105'
                : 'px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition';

            if (action.href) {
              return (
                <Link key={index} href={action.href} className={buttonClasses}>
                  <span className="flex items-center gap-2">
                    {action.icon}
                    {action.label}
                  </span>
                </Link>
              );
            }

            return (
              <button
                key={index}
                onClick={action.onClick}
                className={buttonClasses}
              >
                <span className="flex items-center gap-2">
                  {action.icon}
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Quick access to presets
interface PresetEmptyStateProps {
  preset: keyof typeof emptyStatePresets;
  onAction?: () => void;
  className?: string;
}

export function PresetEmptyState({ preset, onAction, className }: PresetEmptyStateProps) {
  const config = emptyStatePresets[preset];

  // Add onClick handler to actions if provided
  const actions = config.actions.map((action) => ({
    ...action,
    onClick: onAction,
  }));

  return (
    <EmptyState
      {...config}
      actions={actions}
      className={className}
    />
  );
}

// Specialized empty state for upload areas
interface UploadEmptyStateProps {
  onUpload?: () => void;
  isDragActive?: boolean;
  className?: string;
}

export function UploadEmptyState({ onUpload, isDragActive, className = '' }: UploadEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-6 transition-all ${
        isDragActive ? 'scale-105' : ''
      } ${className}`}
    >
      <div className="mb-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
            isDragActive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-700/50 text-gray-400'
          }`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">
        {isDragActive ? 'Drop your image here' : 'Upload an image'}
      </h3>

      <p className="text-gray-400 text-sm mb-4">
        {isDragActive
          ? 'Release to upload your image'
          : 'Drag and drop or click to browse'}
      </p>

      <div className="flex flex-wrap gap-2 justify-center text-xs text-gray-500">
        <span className="px-2 py-1 bg-gray-800 rounded">JPG</span>
        <span className="px-2 py-1 bg-gray-800 rounded">PNG</span>
        <span className="px-2 py-1 bg-gray-800 rounded">WebP</span>
        <span className="px-2 py-1 bg-gray-800 rounded">Max 30MB</span>
      </div>
    </div>
  );
}
