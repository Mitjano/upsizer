"use client";

import { useState, useCallback } from "react";
import { AI_PRESETS, AIPreset } from "@/lib/aiPresets";
import ImageComparison from "./ImageComparison";
import { FaTimes, FaInfoCircle } from "react-icons/fa";

export default function EnhancedImageUploader() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [scale, setScale] = useState(2);
  const [enhanceFace, setEnhanceFace] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string>("portrait");
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: number} | null>(null);

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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
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

  const applyPreset = (preset: AIPreset) => {
    setSelectedPreset(preset.id);
    setScale(preset.scale);
    setEnhanceFace(preset.enhanceFace);
    // Nie zamykamy presetów - pozostają widoczne
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
      setProgress("Processing complete!");
      setUpscaledUrl(data.imageUrl);

    } catch (error: any) {
      console.error("Error:", error);
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
      a.download = `upsized_${scale}x_${selectedFile?.name || "image.png"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download image");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUpscaledUrl(null);
    setProgress("");
    setImageInfo(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {!previewUrl ? (
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
              Upload Image
            </label>

            <p className="text-gray-400 mt-4">or drop image anywhere</p>

            <div className="mt-6 text-sm text-gray-500">
              <p className="mb-2">Paste image or URL • Ctrl + V</p>
              <p>Supported formats: png | jpeg | jpg | webp | heic</p>
            </div>
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
                    src={previewUrl}
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
                  disabled={processing}
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
                  disabled={processing}
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
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {!upscaledUrl ? (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition shadow-lg shadow-green-500/20"
              >
                {processing ? "Processing..." : "🚀 Process Image"}
              </button>
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
