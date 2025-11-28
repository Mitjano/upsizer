"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import ImageComparison from "./ImageComparison";
import { FaTimes, FaInfoCircle } from "react-icons/fa";

type TaskType = 'real_sr' | 'denoise' | 'jpeg_car';

const TASK_OPTIONS: { value: TaskType; label: string; description: string }[] = [
  { value: 'real_sr', label: 'Super Resolution', description: 'General image enhancement & upscaling' },
  { value: 'denoise', label: 'Denoise', description: 'Remove noise and grain from photos' },
  { value: 'jpeg_car', label: 'JPEG Artifact Removal', description: 'Remove compression artifacts' },
];

export default function ImageDenoiser() {
  const { data: session } = useSession();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: number} | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [task, setTask] = useState<TaskType>('denoise');

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
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (PNG, JPG, JPEG, WEBP)");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert("File size must be less than 20MB");
      return;
    }

    setSelectedFile(file);
    setProcessedUrl(null);

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

  const handleProcess = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setProgress("Uploading image...");
    setProcessedUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("task", task);

      const taskLabel = TASK_OPTIONS.find(t => t.value === task)?.label || 'Processing';
      setProgress(`${taskLabel} with SwinIR AI...`);

      const response = await fetch("/api/denoise", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process image");
      }

      const data = await response.json();

      if (data.success && data.processedImage) {
        setProgress("Processing complete!");
        setProcessedUrl(data.processedImage);
        setCreditsRemaining(data.creditsRemaining);
      } else {
        throw new Error("No processed image in response");
      }

    } catch (error: any) {
      console.error("Denoise error:", error);
      alert(`Failed to process image: ${error.message}`);
      setProgress("");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!processedUrl) return;

    try {
      const link = document.createElement("a");
      link.href = processedUrl;
      link.download = `pixelift_${task}_${selectedFile?.name || "image.png"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download image");
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setProgress("");
    setImageInfo(null);
  };

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative border-2 border-dashed border-gray-600 rounded-2xl p-12 bg-gray-800/30">
          <div className="text-center">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Sign in to Restore Images</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start restoring and denoising your photos with AI.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/auth/signin" className="inline-block px-8 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition">
                Sign In
              </a>
              <a href="/auth/signup" className="inline-block px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition">
                Sign Up Free
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {!previewUrl ? (
        <div>
          {/* Task Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Select Restoration Type</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {TASK_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTask(option.value)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    task === option.value
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
              dragActive ? "border-cyan-500 bg-cyan-500/10" : "border-gray-600 hover:border-gray-500"
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
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleChange}
            />

            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <label htmlFor="file-upload" className="cursor-pointer inline-block px-8 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition mb-4">
                Upload Image to Restore
              </label>

              <p className="text-gray-400 mt-4">or drop image anywhere</p>
              <div className="mt-6 text-sm text-gray-500">
                <p className="mb-2">Supported formats: png | jpeg | jpg | webp</p>
                <p>Maximum file size: 20MB</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={handleReset} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500 transition">
              <FaTimes className="text-red-500" />
            </button>
          </div>

          {imageInfo && (
            <div className="flex items-center gap-4 text-sm text-gray-400 bg-gray-800/30 rounded-lg p-3">
              <FaInfoCircle className="text-cyan-400" />
              <span>{imageInfo.width} x {imageInfo.height} px</span>
              <span>-</span>
              <span>{(imageInfo.size / 1024 / 1024).toFixed(2)} MB</span>
              <span>-</span>
              <span className="text-cyan-400">{TASK_OPTIONS.find(t => t.value === task)?.label}</span>
              {creditsRemaining !== null && (
                <>
                  <span>-</span>
                  <span className="text-cyan-400">{creditsRemaining} credits remaining</span>
                </>
              )}
            </div>
          )}

          {/* Task Selection */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Restoration Type</h3>
            <div className="grid md:grid-cols-3 gap-3">
              {TASK_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTask(option.value)}
                  disabled={processing}
                  className={`p-3 rounded-lg border-2 text-left transition ${
                    task === option.value
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-semibold text-sm">{option.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            {processedUrl && previewUrl ? (
              <ImageComparison
                beforeImage={previewUrl}
                afterImage={processedUrl}
                beforeLabel="Original"
                afterLabel={TASK_OPTIONS.find(t => t.value === task)?.label || 'Restored'}
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Original Image</h3>
                  <img src={previewUrl || undefined} alt="Original" className="w-full rounded-lg border border-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Restored Preview</h3>
                  <div className="w-full aspect-square bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                    {processing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">{progress}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Click "Restore Image" to process</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {!processedUrl ? (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-12 py-5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition shadow-xl shadow-cyan-500/30"
              >
                {processing ? "Processing..." : "Restore Image"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold text-lg transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Restored Image
                </button>
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
                >
                  Process Again
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
