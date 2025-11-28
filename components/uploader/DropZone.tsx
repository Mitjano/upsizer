"use client";

import { useCallback } from "react";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  batchMode: boolean;
  dragActive: boolean;
  setDragActive: (active: boolean) => void;
}

const VALID_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "image/bmp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Drag and drop zone for file uploads
 */
export default function DropZone({
  onFilesSelected,
  batchMode,
  dragActive,
  setDragActive
}: DropZoneProps) {

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, [setDragActive]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  }, [setDragActive, onFilesSelected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validFiles = validateFiles(files);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const validateFiles = (files: File[]): File[] => {
    const maxFiles = 50;

    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} images allowed at once`);
      return [];
    }

    return files.filter(file => {
      if (!VALID_TYPES.includes(file.type)) {
        alert(`${file.name}: Invalid file type. Supported: PNG, JPG, WEBP, HEIC, BMP`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name}: File size must be less than 10MB`);
        return false;
      }
      return true;
    });
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
        dragActive
          ? "border-green-500 bg-green-500/10"
          : "border-gray-600 hover:border-gray-500"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/bmp"
        multiple={batchMode}
        onChange={handleChange}
      />

      <div className="text-center">
        <div className="mb-4">
          <UploadIcon />
        </div>

        <label
          htmlFor="file-upload"
          className="cursor-pointer inline-block px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition mb-4"
        >
          {batchMode ? "Upload Multiple Images" : "Upload Image"}
        </label>

        <p className="text-gray-400 mt-4">
          {batchMode ? "or drop up to 50 images anywhere" : "or drop image anywhere"}
        </p>

        <div className="mt-6 text-sm text-gray-500">
          {batchMode ? (
            <>
              <p className="mb-2">Process up to 50 images at once</p>
              <p>All images will use the same settings</p>
            </>
          ) : (
            <>
              <p className="mb-2">Paste image or URL • Ctrl + V</p>
              <p>Supported formats: png | jpeg | jpg | webp | heic</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      className="mx-auto h-12 w-12 text-gray-400"
      stroke="currentColor"
      fill="none"
      viewBox="0 0 48 48"
    >
      <path
        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
