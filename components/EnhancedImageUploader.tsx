"use client";

import { useState, useCallback } from "react";
import { AI_PRESETS, AIPreset } from "@/lib/aiPresets";
import ImageComparison from "./ImageComparison";
import { FaTimes, FaInfoCircle } from "react-icons/fa";

interface BatchImageItem {
  file: File;
  id: string;
  previewUrl: string;
  upscaledUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: string;
  error?: string;
  imageInfo?: {width: number, height: number, size: number};
}

export default function EnhancedImageUploader() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");

  // Batch processing
  const [batchMode, setBatchMode] = useState(false);
  const [batchImages, setBatchImages] = useState<BatchImageItem[]>([]);
  const [processingBatch, setProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Preview system
  const [freePreviewUrl, setFreePreviewUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [scale, setScale] = useState(2);
  const [enhanceFace, setEnhanceFace] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string>("portrait");
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: number} | null>(null);

  // New enhancement options
  const [denoise, setDenoise] = useState(false);
  const [removeArtifacts, setRemoveArtifacts] = useState(false);
  const [colorCorrection, setColorCorrection] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length > 1 || batchMode) {
        handleMultipleFiles(Array.from(e.dataTransfer.files));
      } else {
        handleFile(e.dataTransfer.files[0]);
      }
    }
  }, [batchMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 1 || batchMode) {
        handleMultipleFiles(Array.from(e.target.files));
      } else {
        handleFile(e.target.files[0]);
      }
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "image/bmp"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (PNG, JPG, JPEG, WEBP, HEIC, BMP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        setImageInfo({
          width: img.width,
          height: img.height,
          size: file.size,
        });
      };
      img.src = reader.result as string;
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleFiles = (files: File[]) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "image/bmp"];
    const maxFiles = 50;

    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} images allowed at once`);
      return;
    }

    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        alert(`${file.name}: Invalid file type`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}: File size must be less than 10MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setBatchMode(true);

    const newBatchImages: BatchImageItem[] = validFiles.map(file => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        file,
        id,
        previewUrl: '',
        status: 'pending' as const,
      };
    });

    // Load preview URLs for each image
    newBatchImages.forEach(item => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          setBatchImages(prev => prev.map(i =>
            i.id === item.id
              ? { ...i, previewUrl: reader.result as string, imageInfo: { width: img.width, height: img.height, size: item.file.size } }
              : i
          ));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(item.file);
    });

    setBatchImages(newBatchImages);
  };

  const applyPreset = (preset: AIPreset) => {
    setSelectedPreset(preset.id);
    setScale(preset.scale);
    setEnhanceFace(preset.enhanceFace);
    // Apply new enhancement options from preset
    setDenoise(preset.denoise || false);
    setRemoveArtifacts(preset.removeArtifacts || false);
    setColorCorrection(preset.colorCorrection || false);
    // Clear preview when settings change
    setFreePreviewUrl(null);
    // Nie zamykamy presetów - pozostają widoczne
  };

  // Generate FREE 200x200px preview
  const handleFreePreview = async () => {
    if (!selectedFile) return;

    setGeneratingPreview(true);
    setFreePreviewUrl(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("scale", scale.toString());
      formData.append("enhanceFace", enhanceFace.toString());
      formData.append("denoise", denoise.toString());
      formData.append("removeArtifacts", removeArtifacts.toString());

      const response = await fetch("/api/preview", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to generate preview");
      }

      const data = await response.json();
      console.log("Preview API response:", data);

      if (data.success && data.previewUrl) {
        setFreePreviewUrl(data.previewUrl);
      } else {
        throw new Error("No preview URL in response");
      }

    } catch (error: any) {
      console.error("Preview error:", error);
      alert(`Failed to generate preview: ${error.message}`);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setProgress("Uploading image...");
    setUpscaledUrl(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("scale", scale.toString());
      formData.append("enhanceFace", enhanceFace.toString());
      formData.append("denoise", denoise.toString());
      formData.append("removeArtifacts", removeArtifacts.toString());
      formData.append("colorCorrection", colorCorrection.toString());

      setProgress(enhanceFace ? "Enhancing with GFPGAN AI..." : "Upscaling with Real-ESRGAN AI...");

      const response = await fetch("/api/upscale", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Failed to process image");
      }

      const data = await response.json();
      console.log("Upscale API response:", data);

      if (data.success && data.imageUrl) {
        setProgress("Processing complete!");
        setUpscaledUrl(data.imageUrl);
      } else {
        throw new Error("No image URL in response");
      }

    } catch (error: any) {
      console.error("Upscale error:", error);
      alert(`Failed to process image: ${error.message}`);
      setProgress("");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!upscaledUrl) return;

    try {
      const response = await fetch(upscaledUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pixelift_${scale}x_${selectedFile?.name || "image.png"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download image");
    }
  };

  const handleBatchProcess = async () => {
    if (batchImages.length === 0) return;

    setProcessingBatch(true);
    setBatchProgress({ current: 0, total: batchImages.length });

    for (let i = 0; i < batchImages.length; i++) {
      const item = batchImages[i];
      setBatchProgress({ current: i + 1, total: batchImages.length });

      // Update status to processing
      setBatchImages(prev => prev.map(img =>
        img.id === item.id ? { ...img, status: 'processing' as const, progress: 'Processing...' } : img
      ));

      try {
        const formData = new FormData();
        formData.append("image", item.file);
        formData.append("scale", scale.toString());
        formData.append("enhanceFace", enhanceFace.toString());
        formData.append("denoise", denoise.toString());
        formData.append("removeArtifacts", removeArtifacts.toString());
        formData.append("colorCorrection", colorCorrection.toString());

        const response = await fetch("/api/upscale", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || "Failed to process image");
        }

        const data = await response.json();

        // Update with result
        setBatchImages(prev => prev.map(img =>
          img.id === item.id
            ? { ...img, status: 'completed' as const, upscaledUrl: data.imageUrl, progress: 'Complete!' }
            : img
        ));

      } catch (error: any) {
        console.error(`Error processing ${item.file.name}:`, error);
        setBatchImages(prev => prev.map(img =>
          img.id === item.id
            ? { ...img, status: 'error' as const, error: error.message }
            : img
        ));
      }

      // Small delay between requests to avoid overwhelming the API
      if (i < batchImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setProcessingBatch(false);
  };

  const handleDownloadAll = async () => {
    const completedImages = batchImages.filter(img => img.status === 'completed' && img.upscaledUrl);

    for (const img of completedImages) {
      try {
        const response = await fetch(img.upscaledUrl!);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pixelift_${scale}x_${img.file.name}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error downloading ${img.file.name}:`, error);
      }
    }
  };

  const removeBatchImage = (id: string) => {
    setBatchImages(prev => prev.filter(img => img.id !== id));
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUpscaledUrl(null);
    setProgress("");
    setImageInfo(null);
    setBatchMode(false);
    setBatchImages([]);
    setProcessingBatch(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {!previewUrl && !batchMode ? (
        <div>
          {/* Batch Mode Toggle */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-1 flex gap-1">
              <button
                onClick={() => setBatchMode(false)}
                className={`px-6 py-2 rounded-md font-medium transition ${
                  !batchMode
                    ? "bg-green-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Single Image
              </button>
              <button
                onClick={() => setBatchMode(true)}
                className={`px-6 py-2 rounded-md font-medium transition ${
                  batchMode
                    ? "bg-green-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Batch Processing
              </button>
            </div>
          </div>

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
        </div>
      ) : batchMode ? (
        <div className="space-y-6">
          {/* Batch Mode Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Batch Processing</h2>
              <p className="text-gray-400 text-sm mt-1">
                {batchImages.length} images • Same settings applied to all
              </p>
            </div>
            <button
              onClick={handleReset}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500 transition"
            >
              <FaTimes className="text-red-500" />
            </button>
          </div>

          {/* AI Presets - Always Visible */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-4">Choose AI Preset for All Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AI_PRESETS.filter(p => p.id !== "custom").map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`text-center p-4 rounded-lg border-2 transition hover:scale-105 ${
                    selectedPreset === preset.id
                      ? "border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20"
                      : "border-gray-600 hover:border-gray-500 hover:bg-gray-700/50"
                  }`}
                  disabled={processingBatch}
                >
                  <div className="text-4xl mb-2">{preset.icon}</div>
                  <div className="font-semibold text-sm mb-1">{preset.name}</div>
                  <div className="text-xs text-gray-400 mb-2 line-clamp-2">{preset.description}</div>
                  <div className={`text-xs font-medium ${selectedPreset === preset.id ? "text-green-400" : "text-gray-500"}`}>
                    {preset.scale}x • {preset.enhanceFace ? "Face" : "Standard"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Batch Progress */}
          {processingBatch && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-6">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <div>
                  <p className="font-semibold">Processing Batch...</p>
                  <p className="text-sm text-gray-400">
                    Image {batchProgress.current} of {batchProgress.total}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Batch Images Grid */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Images Queue</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
              {batchImages.map((item) => (
                <div
                  key={item.id}
                  className={`relative rounded-lg border-2 p-3 ${
                    item.status === 'completed' ? 'border-green-500 bg-green-500/10' :
                    item.status === 'processing' ? 'border-blue-500 bg-blue-500/10' :
                    item.status === 'error' ? 'border-red-500 bg-red-500/10' :
                    'border-gray-600'
                  }`}
                >
                  {/* Remove button */}
                  {item.status === 'pending' && !processingBatch && (
                    <button
                      onClick={() => removeBatchImage(item.id)}
                      className="absolute top-2 right-2 z-10 p-1 rounded-full bg-red-500/80 hover:bg-red-500"
                    >
                      <FaTimes className="text-white text-xs" />
                    </button>
                  )}

                  {/* Image preview */}
                  {item.previewUrl && (
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}

                  {/* File info */}
                  <p className="text-xs font-medium truncate mb-1">{item.file.name}</p>
                  {item.imageInfo && (
                    <p className="text-xs text-gray-400">
                      {item.imageInfo.width}×{item.imageInfo.height}
                    </p>
                  )}

                  {/* Status */}
                  <div className="mt-2">
                    {item.status === 'pending' && (
                      <span className="text-xs text-gray-400">⏳ Pending</span>
                    )}
                    {item.status === 'processing' && (
                      <span className="text-xs text-blue-400">⚙️ Processing...</span>
                    )}
                    {item.status === 'completed' && item.upscaledUrl && (
                      <a
                        href={item.upscaledUrl}
                        download={`pixelift_${scale}x_${item.file.name}`}
                        className="text-xs text-green-400 hover:underline flex items-center gap-1"
                      >
                        ✅ Download
                      </a>
                    )}
                    {item.status === 'error' && (
                      <span className="text-xs text-red-400">❌ {item.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Batch Settings</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upscale Level</label>
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3"
                  value={scale}
                  onChange={(e) => {
                    setScale(parseInt(e.target.value));
                    setSelectedPreset("custom");
                  }}
                  disabled={processingBatch}
                >
                  <option value={1}>1x (Quality Only)</option>
                  <option value={2}>2x (Standard)</option>
                  <option value={4}>4x (High Quality)</option>
                  <option value={8}>8x (Maximum)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Face Enhancement</label>
                <button
                  className={`w-full py-3 rounded-lg font-medium transition ${
                    enhanceFace
                      ? "bg-green-500 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                  onClick={() => {
                    setEnhanceFace(!enhanceFace);
                    setSelectedPreset("custom");
                  }}
                  disabled={processingBatch}
                >
                  {enhanceFace ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Active Preset</label>
                <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3">
                  <span className="flex items-center gap-2">
                    {AI_PRESETS.find(p => p.id === selectedPreset)?.icon}
                    {AI_PRESETS.find(p => p.id === selectedPreset)?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Enhancement Options */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3 text-gray-300">Enhancement Options</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition">
                  <div>
                    <div className="font-medium text-sm">Denoise</div>
                    <div className="text-xs text-gray-400">Remove grain & noise</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={denoise}
                    onChange={(e) => {
                      setDenoise(e.target.checked);
                      setSelectedPreset("custom");
                    }}
                    disabled={processingBatch}
                    className="w-5 h-5 text-green-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition">
                  <div>
                    <div className="font-medium text-sm">Remove Artifacts</div>
                    <div className="text-xs text-gray-400">Fix JPEG compression</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={removeArtifacts}
                    onChange={(e) => {
                      setRemoveArtifacts(e.target.checked);
                      setSelectedPreset("custom");
                    }}
                    disabled={processingBatch}
                    className="w-5 h-5 text-green-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition">
                  <div>
                    <div className="font-medium text-sm">Color Correction</div>
                    <div className="text-xs text-gray-400">Auto-enhance colors</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={colorCorrection}
                    onChange={(e) => {
                      setColorCorrection(e.target.checked);
                      setSelectedPreset("custom");
                    }}
                    disabled={processingBatch}
                    className="w-5 h-5 text-green-500 rounded"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {batchImages.some(img => img.status === 'completed') && (
              <button
                onClick={handleDownloadAll}
                disabled={processingBatch}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition shadow-lg shadow-green-500/20"
              >
                Download All ({batchImages.filter(img => img.status === 'completed').length})
              </button>
            )}

            <button
              onClick={handleBatchProcess}
              disabled={processingBatch || batchImages.length === 0}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition shadow-lg shadow-blue-500/20"
            >
              {processingBatch ? `Processing ${batchProgress.current}/${batchProgress.total}...` : `Process All ${batchImages.length} Images`}
            </button>

            <button
              onClick={handleReset}
              disabled={processingBatch}
              className="px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              Start New Batch
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Close Button */}
          <div className="flex justify-end">
            <button
              onClick={handleReset}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500 transition"
            >
              <FaTimes className="text-red-500" />
            </button>
          </div>

          {/* AI Presets - Always Visible */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h3 className="text-xl font-bold mb-4">Choose AI Preset</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AI_PRESETS.filter(p => p.id !== "custom").map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`text-center p-4 rounded-lg border-2 transition hover:scale-105 ${
                    selectedPreset === preset.id
                      ? "border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20"
                      : "border-gray-600 hover:border-gray-500 hover:bg-gray-700/50"
                  }`}
                  disabled={processing}
                >
                  <div className="text-4xl mb-2">{preset.icon}</div>
                  <div className="font-semibold text-sm mb-1">{preset.name}</div>
                  <div className="text-xs text-gray-400 mb-2 line-clamp-2">{preset.description}</div>
                  <div className={`text-xs font-medium ${selectedPreset === preset.id ? "text-green-400" : "text-gray-500"}`}>
                    {preset.scale}x • {preset.enhanceFace ? "Face" : "Standard"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Image Info */}
          {imageInfo && (
            <div className="flex items-center gap-4 text-sm text-gray-400 bg-gray-800/30 rounded-lg p-3">
              <FaInfoCircle className="text-blue-400" />
              <span>
                {imageInfo.width} × {imageInfo.height} px
              </span>
              <span>•</span>
              <span>{(imageInfo.size / 1024 / 1024).toFixed(2)} MB</span>
              <span>•</span>
              <span>Output: {imageInfo.width * scale} × {imageInfo.height * scale} px</span>
            </div>
          )}

          {/* Comparison or Preview */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            {upscaledUrl && previewUrl ? (
              <ImageComparison
                beforeImage={previewUrl}
                afterImage={upscaledUrl}
                beforeLabel={`Original (${imageInfo?.width}×${imageInfo?.height})`}
                afterLabel={`${scale}x Enhanced`}
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    Original Image
                  </h3>
                  <img
                    src={previewUrl || undefined}
                    alt="Original"
                    className="w-full rounded-lg border border-gray-600"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    AI Enhanced Preview
                  </h3>
                  <div className="w-full aspect-square bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                    {processing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">{progress}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Click "Process Image" to upscale</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Controls */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>

            {/* Primary Settings Row */}
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upscale Level</label>
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3"
                  value={scale}
                  onChange={(e) => {
                    setScale(parseInt(e.target.value));
                    setSelectedPreset("custom");
                    setFreePreviewUrl(null); // Clear preview on settings change
                  }}
                  disabled={processing || generatingPreview}
                >
                  <option value={1}>1x (Quality Only)</option>
                  <option value={2}>2x (Standard)</option>
                  <option value={4}>4x (High Quality)</option>
                  <option value={8}>8x (Maximum)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Face Enhancement</label>
                <button
                  className={`w-full py-3 rounded-lg font-medium transition ${
                    enhanceFace
                      ? "bg-green-500 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                  onClick={() => {
                    setEnhanceFace(!enhanceFace);
                    setSelectedPreset("custom");
                    setFreePreviewUrl(null); // Clear preview on settings change
                  }}
                  disabled={processing || generatingPreview}
                >
                  {enhanceFace ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Active Preset</label>
                <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3">
                  <span className="flex items-center gap-2">
                    {AI_PRESETS.find(p => p.id === selectedPreset)?.icon}
                    {AI_PRESETS.find(p => p.id === selectedPreset)?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Enhancement Options Row */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3 text-gray-300">🎨 Enhancement Options</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition">
                    <div>
                      <div className="font-medium text-sm">🧹 Denoise</div>
                      <div className="text-xs text-gray-400">Remove grain & noise</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={denoise}
                      onChange={(e) => {
                        setDenoise(e.target.checked);
                        setSelectedPreset("custom");
                        setFreePreviewUrl(null);
                      }}
                      disabled={processing || generatingPreview}
                      className="w-5 h-5 text-green-500 rounded"
                    />
                  </label>
                </div>

                <div>
                  <label className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition">
                    <div>
                      <div className="font-medium text-sm">🔧 Remove Artifacts</div>
                      <div className="text-xs text-gray-400">Fix JPEG compression</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={removeArtifacts}
                      onChange={(e) => {
                        setRemoveArtifacts(e.target.checked);
                        setSelectedPreset("custom");
                        setFreePreviewUrl(null);
                      }}
                      disabled={processing || generatingPreview}
                      className="w-5 h-5 text-green-500 rounded"
                    />
                  </label>
                </div>

                <div>
                  <label className="flex items-center justify-between p-3 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition">
                    <div>
                      <div className="font-medium text-sm">🌈 Color Correction</div>
                      <div className="text-xs text-gray-400">Auto-enhance colors</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={colorCorrection}
                      onChange={(e) => {
                        setColorCorrection(e.target.checked);
                        setSelectedPreset("custom");
                        setFreePreviewUrl(null);
                      }}
                      disabled={processing || generatingPreview}
                      className="w-5 h-5 text-green-500 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* FREE Preview Section */}
          {freePreviewUrl && (
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border-2 border-blue-500/50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    👁️ FREE Preview (200x200px)
                  </h4>
                  <p className="text-sm text-gray-400 mb-4">
                    This is a small sample. Full image processing will use 1 credit.
                  </p>
                  <img
                    src={freePreviewUrl}
                    alt="Preview"
                    className="rounded-lg border-2 border-blue-500/30 max-w-xs"
                  />
                </div>
                <div className="text-sm text-gray-400">
                  <p className="mb-2">✅ Quality looks good?</p>
                  <p>Click "Process Full Image" below to upscale the entire image!</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {!upscaledUrl ? (
              <>
                {/* FREE Preview Button */}
                <button
                  onClick={handleFreePreview}
                  disabled={generatingPreview || processing}
                  className="px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition shadow-lg shadow-blue-500/20"
                >
                  {generatingPreview ? "Generating Preview..." : "👁️ Free Preview"}
                </button>

                {/* Process Full Image Button */}
                <button
                  onClick={handleProcess}
                  disabled={processing || generatingPreview}
                  className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition shadow-lg shadow-green-500/20"
                >
                  {processing ? "Processing..." : "🚀 Process Full Image"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="px-8 py-4 bg-green-500 hover:bg-green-600 rounded-lg font-semibold text-lg transition flex items-center gap-2 shadow-lg shadow-green-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Enhanced Image
                </button>
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
                >
                  🔄 Process Again
                </button>
              </>
            )}
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              Upload New Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
