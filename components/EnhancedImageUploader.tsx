"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { FaTimes } from "react-icons/fa";
import {
  LoginPrompt,
  DropZone,
  SettingsPanel,
  BatchImageGrid,
  ImagePreview,
  ActionButtons,
  ModeToggle,
  BatchImageItem,
  ImageInfo,
} from "./uploader";

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

  // Settings
  const [scale, setScale] = useState(2);
  const [qualityBoost, setQualityBoost] = useState(false);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);

  // File handling
  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 1 || batchMode) {
      handleMultipleFiles(files);
    } else {
      handleSingleFile(files[0]);
    }
  }, [batchMode]);

  const handleSingleFile = (file: File) => {
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
    setBatchMode(true);

    const newBatchImages: BatchImageItem[] = files.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      previewUrl: '',
      status: 'pending' as const,
    }));

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

  // Single image processing
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

      if (data.success && data.imageUrl) {
        setProgress("Processing complete!");
        setUpscaledUrl(data.imageUrl);

        // Log usage
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Upscale error:", error);
      alert(`Failed to process image: ${message}`);
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

  // Batch processing
  const handleBatchProcess = async () => {
    if (batchImages.length === 0) return;

    setProcessingBatch(true);
    setBatchProgress({ current: 0, total: batchImages.length });

    for (let i = 0; i < batchImages.length; i++) {
      const item = batchImages[i];
      setBatchProgress({ current: i + 1, total: batchImages.length });

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

        setBatchImages(prev => prev.map(img =>
          img.id === item.id
            ? { ...img, status: 'completed' as const, upscaledUrl: data.imageUrl, progress: 'Complete!' }
            : img
        ));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error processing ${item.file.name}:`, error);
        setBatchImages(prev => prev.map(img =>
          img.id === item.id
            ? { ...img, status: 'error' as const, error: message }
            : img
        ));
      }

      // Delay between requests
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
    return <LoginPrompt />;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {!previewUrl && !batchMode ? (
        <div>
          <ModeToggle batchMode={batchMode} setBatchMode={setBatchMode} />
          <DropZone
            onFilesSelected={handleFilesSelected}
            batchMode={batchMode}
            dragActive={dragActive}
            setDragActive={setDragActive}
          />
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

          {/* Empty state with dropzone */}
          {batchImages.length === 0 && (
            <DropZone
              onFilesSelected={handleFilesSelected}
              batchMode={true}
              dragActive={dragActive}
              setDragActive={setDragActive}
            />
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
          {batchImages.length > 0 && (
            <BatchImageGrid
              images={batchImages}
              scale={scale}
              processing={processingBatch}
              onRemove={removeBatchImage}
            />
          )}

          {/* Settings */}
          {batchImages.length > 0 && (
            <SettingsPanel
              scale={scale}
              setScale={setScale}
              qualityBoost={qualityBoost}
              setQualityBoost={setQualityBoost}
              disabled={processingBatch}
              title="Batch Settings"
            />
          )}

          {/* Action Buttons */}
          <ActionButtons
            mode="batch"
            processing={processingBatch}
            totalImages={batchImages.length}
            completedCount={batchImages.filter(img => img.status === 'completed').length}
            currentProgress={batchProgress.current}
            totalProgress={batchProgress.total}
            onProcess={handleBatchProcess}
            onDownloadAll={handleDownloadAll}
            onReset={handleReset}
          />
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

          {/* Image Preview */}
          <ImagePreview
            previewUrl={previewUrl}
            upscaledUrl={upscaledUrl}
            imageInfo={imageInfo}
            scale={scale}
            processing={processing}
            progress={progress}
          />

          {/* Settings */}
          <SettingsPanel
            scale={scale}
            setScale={setScale}
            qualityBoost={qualityBoost}
            setQualityBoost={setQualityBoost}
            disabled={processing}
          />

          {/* Action Buttons */}
          <ActionButtons
            mode="single"
            processing={processing}
            hasResult={!!upscaledUrl}
            onProcess={handleProcess}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
