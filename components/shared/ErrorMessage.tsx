"use client";

/**
 * Error message component
 * Used by: Upscaler, BackgroundRemover, ImageExpander
 */

export interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p className="text-red-800 dark:text-red-300">{message}</p>
    </div>
  );
}
