"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
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

  // Simplified settings - like Upscale.media
  const [scale, setScale] = useState(2);
  const [qualityBoost, setQualityBoost] = useState(false); // Simple ON/OFF toggle
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



  const handleProcess = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setProgress("Uploading image...");
    setUpscaledUrl(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("scale", scale.toString());
      formData.append("qualityBoost", qualityBoost.toString());

      setProgress(qualityBoost ? "Enhancing with Premium AI..." : "Upscaling with Standard AI...");

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

        // Log usage to Firebase (full image costs 1 credit)
        if (session?.user?.email) {
          fetch("/api/user/log-usage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.user.email,
              type: "full",
              scale,
              enhanceFace: qualityBoost,
              imageUrl: data.imageUrl,
            }),
          }).catch((err) => console.error("Failed to log usage:", err));
        }
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
        formData.append("qualityBoost", qualityBoost.toString());

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

  // Show login prompt for unauthenticated users
  if (!session) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative border-2 border-dashed border-gray-600 rounded-2xl p-12 bg-gray-800/30">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Sign in to Upload Images</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start upscaling your images with AI. Get 3 free credits to try it out!
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/auth/signin"
                className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition"
              >
                Sign In
              </a>
              <a
                href="/auth/signup"
                className="inline-block px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                Sign Up Free
              </a>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>3 Free Credits</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Add Images Button */}
          {batchImages.length === 0 && (
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center">
              <input
                type="file"
                id="batch-file-upload"
                className="hidden"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/heic,image/bmp"
                multiple
                onChange={handleChange}
              />
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
                htmlFor="batch-file-upload"
                className="cursor-pointer inline-block px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition mb-4"
              >
                Upload Multiple Images
              </label>
              <p className="text-gray-400 mt-4">or drop up to 50 images anywhere</p>
              <p className="text-sm text-gray-500 mt-4">Process up to 50 images at once with the same settings</p>
            </div>
          )}


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

          {/* Simple Settings - Like Upscale.media */}
          {batchImages.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4">Batch Settings</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Upscale to</label>
                  <select
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-base font-medium"
                    value={scale}
                    onChange={(e) => setScale(parseInt(e.target.value))}
                    disabled={processingBatch}
                  >
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                    <option value={8}>8x</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Quality Boost</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setQualityBoost(false)}
                      disabled={processingBatch}
                      className={`flex-1 py-3 rounded-lg font-medium transition ${
                        !qualityBoost
                          ? "bg-gray-700 text-white border-2 border-gray-600"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                    >
                      Off
                    </button>
                    <button
                      onClick={() => setQualityBoost(true)}
                      disabled={processingBatch}
                      className={`flex-1 py-3 rounded-lg font-medium transition ${
                        qualityBoost
                          ? "bg-green-500 text-white border-2 border-green-400"
                          : "bg-gray-800 text-gray-400 border border-gray-700"
                      }`}
                    >
                      On
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Simple Settings - Like Upscale.media */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Upscale to</label>
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-base font-medium"
                  value={scale}
                  onChange={(e) => setScale(parseInt(e.target.value))}
                  disabled={processing}
                >
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                  <option value={8}>8x</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quality Boost</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setQualityBoost(false)}
                    disabled={processing}
                    className={`flex-1 py-3 rounded-lg font-medium transition ${
                      !qualityBoost
                        ? "bg-gray-700 text-white border-2 border-gray-600"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                    }`}
                  >
                    Off
                  </button>
                  <button
                    onClick={() => setQualityBoost(true)}
                    disabled={processing}
                    className={`flex-1 py-3 rounded-lg font-medium transition ${
                      qualityBoost
                        ? "bg-green-500 text-white border-2 border-green-400"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                    }`}
                  >
                    On
                  </button>
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
                className="px-12 py-5 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition shadow-xl shadow-green-500/30"
              >
                {processing ? "Processing..." : "Process Image"}
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
