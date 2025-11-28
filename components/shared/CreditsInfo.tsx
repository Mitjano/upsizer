"use client";

/**
 * Credits info banner shown after processing
 * Used by: Upscaler, BackgroundRemover, ImageExpander
 */

export interface CreditsInfoProps {
  message: string;
  creditsRemaining: number;
  extraInfo?: string;
  accentColor?: 'green' | 'blue' | 'purple';
}

const COLOR_CLASSES = {
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-300',
    subtext: 'text-green-600 dark:text-green-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-300',
    subtext: 'text-blue-600 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-800 dark:text-purple-300',
    subtext: 'text-purple-600 dark:text-purple-400',
  },
};

export default function CreditsInfo({
  message,
  creditsRemaining,
  extraInfo,
  accentColor = 'green',
}: CreditsInfoProps) {
  const colors = COLOR_CLASSES[accentColor];

  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
      <p className={`${colors.text} text-sm`}>
        {message} You have <strong>{creditsRemaining} credits</strong> remaining.
      </p>
      {extraInfo && (
        <p className={`${colors.subtext} text-xs mt-1`}>
          {extraInfo}
        </p>
      )}
    </div>
  );
}
