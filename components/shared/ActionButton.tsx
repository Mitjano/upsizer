"use client";

/**
 * Reusable action button component
 * Used by: Upscaler, BackgroundRemover, ImageExpander
 */

export interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  accentColor?: 'green' | 'blue' | 'purple' | 'gray';
  icon?: 'download' | 'upload' | 'refresh' | 'lightning' | 'new';
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES = {
  primary: {
    green: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl',
    gray: 'bg-gray-600 hover:bg-gray-700 text-white shadow-lg hover:shadow-xl',
  },
  secondary: {
    green: 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200',
    blue: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200',
    purple: 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-200',
    gray: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white',
  },
  outline: {
    green: 'border-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
    blue: 'border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    purple: 'border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20',
    gray: 'border-2 border-gray-500 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20',
  },
};

const ICONS = {
  download: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  upload: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  refresh: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  lightning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  new: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
};

export default function ActionButton({
  onClick,
  disabled = false,
  variant = 'primary',
  accentColor = 'green',
  icon,
  children,
  className = '',
}: ActionButtonProps) {
  const variantClasses = VARIANT_CLASSES[variant][accentColor];
  const iconElement = icon ? ICONS[icon] : null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors
        ${variantClasses}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {iconElement}
      {children}
    </button>
  );
}
