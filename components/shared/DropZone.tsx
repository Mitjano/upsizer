"use client";

import { useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Generic drop zone for file uploads
 * Used by: Upscaler, BackgroundRemover, ImageExpander
 */

export interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
  disabled?: boolean;
  processing?: boolean;
  accentColor?: 'green' | 'blue' | 'purple';
  // Custom content
  title?: string;
  subtitle?: string;
  processingTitle?: string;
  processingSubtitle?: string;
  hints?: string[];
  creditsPerImage?: number;
}

const COLOR_CLASSES = {
  green: {
    border: 'border-green-500 bg-green-500/10',
    button: 'bg-green-500 hover:bg-green-600',
    gradient: 'from-green-500 to-emerald-600',
  },
  blue: {
    border: 'border-blue-500 bg-blue-500/10',
    button: 'bg-blue-500 hover:bg-blue-600',
    gradient: 'from-blue-500 to-cyan-600',
  },
  purple: {
    border: 'border-purple-500 bg-purple-500/10',
    button: 'bg-purple-500 hover:bg-purple-600',
    gradient: 'from-purple-500 to-indigo-600',
  },
};

const DEFAULT_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function DropZone({
  onFilesSelected,
  multiple = false,
  maxFiles = 50,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_TYPES,
  dragActive,
  setDragActive,
  disabled = false,
  processing = false,
  accentColor = 'green',
  title,
  subtitle = "or click to browse",
  processingTitle = "Processing your image...",
  processingSubtitle = "This may take a few seconds",
  hints,
  creditsPerImage,
}: DropZoneProps) {
  const colors = COLOR_CLASSES[accentColor];

  const defaultTitle = multiple ? "Drag & drop your images" : "Drag & drop your image";
  const displayTitle = title || defaultTitle;

  const defaultHints = multiple
    ? [`Process up to ${maxFiles} images at once`, "All images will use the same settings"]
    : [`Max ${Math.round(maxSize / 1024 / 1024)}MB`, `Supports ${acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`];
  const displayHints = hints || defaultHints;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || processing) return;

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, [setDragActive, disabled, processing]);

  const validateFiles = useCallback((files: File[]): File[] => {
    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed at once`);
      return [];
    }

    return files.filter(file => {
      if (!acceptedTypes.includes(file.type)) {
        const extensions = acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
        toast.error(`${file.name}: Invalid file type. Supported: ${extensions}`);
        return false;
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
        return false;
      }
      return true;
    });
  }, [acceptedTypes, maxSize, maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || processing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(multiple ? files : [files[0]]);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  }, [setDragActive, onFilesSelected, validateFiles, disabled, processing, multiple]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled || processing) return;

    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validFiles = validateFiles(multiple ? files : [files[0]]);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  }, [onFilesSelected, validateFiles, disabled, processing, multiple]);

  const acceptString = acceptedTypes.join(',');

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center
        transition-all duration-300 ease-in-out
        ${dragActive ? colors.border : 'border-gray-600 hover:border-gray-500'}
        ${(disabled || processing) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="shared-file-upload"
        className="hidden"
        accept={acceptString}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled || processing}
      />

      <div className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`w-20 h-20 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>

        {/* Text */}
        {processing ? (
          <>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {processingTitle}
            </h3>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current" style={{ borderColor: accentColor }}></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {processingSubtitle}
            </p>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {dragActive ? 'Drop your image here!' : displayTitle}
            </h3>

            <label
              htmlFor="shared-file-upload"
              className={`cursor-pointer inline-block px-8 py-3 ${colors.button} rounded-lg font-medium transition text-white`}
            >
              {multiple ? "Upload Multiple Images" : "Upload Image"}
            </label>

            <p className="text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>

            <div className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
              {displayHints.map((hint, i) => (
                <p key={i}>{hint}</p>
              ))}
              {creditsPerImage !== undefined && (
                <p>{creditsPerImage} credit{creditsPerImage !== 1 ? 's' : ''} per image</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
