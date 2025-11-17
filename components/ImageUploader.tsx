"use client";

import { useState, useCallback } from "react";

export default function ImageUploader() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [scale, setScale] = useState(2);
  const [enhanceFace, setEnhanceFace] = useState(true);

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
    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "image/bmp"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (PNG, JPG, JPEG, WEBP, HEIC, BMP)");
      return;
    }

    // Validate file size (max 10MB for free tier)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
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
      a.download = `upscaled_${scale}x_${selectedFile?.name || "image.png"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download image");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
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
          {/* Preview Section */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
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
                  AI Upscaled to {scale}x {upscaledUrl && `(${scale * 100}%)`}
                </h3>
                {upscaledUrl ? (
                  <img
                    src={upscaledUrl}
                    alt="Upscaled"
                    className="w-full rounded-lg border border-green-500"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                    {processing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">{progress}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Click &quot;Process Image&quot; to upscale</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Upscale to</label>
              <select
                className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2"
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                disabled={processing}
              >
                <option value={2}>2x</option>
                <option value={4}>4x</option>
                <option value={8}>8x</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Enhance Face Quality</label>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  enhanceFace
                    ? "bg-green-500 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
                onClick={() => setEnhanceFace(!enhanceFace)}
                disabled={processing}
              >
                {enhanceFace ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {!upscaledUrl ? (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition"
              >
                {processing ? "Processing..." : "Process Image"}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Image
              </button>
            )}
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                setUpscaledUrl(null);
                setProgress("");
              }}
              disabled={processing}
              className="px-8 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-medium transition"
            >
              Upload New
            </button>
          </div>

          {/* Limits Notice */}
          <div className="text-center text-sm text-gray-400 bg-gray-800/30 rounded-lg p-4">
            <p>Your outputs will be capped to a maximum resolution of 10000 x 10000 px.</p>
            <p className="mt-1">
              <button className="text-green-400 hover:underline">Sign Up</button> to unlock
              higher resolutions upto 20000 x 20000 px.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
