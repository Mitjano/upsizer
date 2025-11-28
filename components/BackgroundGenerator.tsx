"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import ImageComparison from "./ImageComparison";
import { FaTimes, FaInfoCircle, FaMagic } from "react-icons/fa";

const PROMPT_PRESETS = [
  { label: "Studio White", prompt: "professional white studio background, clean, minimal" },
  { label: "Studio Gray", prompt: "professional gray studio background, gradient, elegant" },
  { label: "Nature", prompt: "beautiful nature background, soft bokeh, outdoor, natural light" },
  { label: "Office", prompt: "modern office background, professional workspace, clean" },
  { label: "Urban", prompt: "urban city background, modern architecture, stylish" },
  { label: "Abstract", prompt: "abstract gradient background, colorful, modern, artistic" },
];

export default function BackgroundGenerator() {
  const { data: session } = useSession();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: number} | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  const [prompt, setPrompt] = useState("professional studio background, clean, elegant");
  const [negativePrompt, setNegativePrompt] = useState("low quality, blurry, distorted, ugly");
  const [refinePrompt, setRefinePrompt] = useState(true);

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
    setGeneratedUrl(null);

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
    setGeneratedUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("prompt", prompt);
      formData.append("negative_prompt", negativePrompt);
      formData.append("refine_prompt", refinePrompt.toString());

      setProgress("Generating background with BRIA AI...");

      const response = await fetch("/api/background-generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate background");
      }

      const data = await response.json();

      if (data.success && data.generatedImage) {
        setProgress("Background generation complete!");
        setGeneratedUrl(data.generatedImage);
        setCreditsRemaining(data.creditsRemaining);
      } else {
        throw new Error("No generated image in response");
      }

    } catch (error: any) {
      console.error("Background generation error:", error);
      alert(`Failed to generate background: ${error.message}`);
      setProgress("");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedUrl) return;

    try {
      const link = document.createElement("a");
      link.href = generatedUrl;
      link.download = `pixelift_background_${selectedFile?.name || "image.png"}`;
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
    setGeneratedUrl(null);
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
            <h3 className="text-2xl font-bold mb-3">Sign in to Generate Backgrounds</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start generating AI backgrounds for your photos.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/auth/signin" className="inline-block px-8 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-medium transition">
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
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
            dragActive ? "border-pink-500 bg-pink-500/10" : "border-gray-600 hover:border-gray-500"
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

            <label htmlFor="file-upload" className="cursor-pointer inline-block px-8 py-3 bg-pink-500 hover:bg-pink-600 rounded-lg font-medium transition mb-4">
              Upload Image (with transparent/removed background)
            </label>

            <p className="text-gray-400 mt-4">or drop image anywhere</p>
            <div className="mt-6 text-sm text-gray-500">
              <p className="mb-2">Best results with transparent PNG or images with removed background</p>
              <p>Maximum file size: 20MB</p>
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
              <FaInfoCircle className="text-pink-400" />
              <span>{imageInfo.width} x {imageInfo.height} px</span>
              <span>-</span>
              <span>{(imageInfo.size / 1024 / 1024).toFixed(2)} MB</span>
              {creditsRemaining !== null && (
                <>
                  <span>-</span>
                  <span className="text-pink-400">{creditsRemaining} credits remaining</span>
                </>
              )}
            </div>
          )}

          {/* Prompt Settings */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FaMagic className="text-pink-400" />
              Background Settings
            </h3>

            {/* Preset Buttons */}
            <div className="flex flex-wrap gap-2">
              {PROMPT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setPrompt(preset.prompt)}
                  className={`px-3 py-2 rounded-lg text-sm transition ${
                    prompt === preset.prompt
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Describe the background you want
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={processing}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm resize-none"
                rows={2}
                placeholder="professional studio background, clean, elegant..."
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                What to avoid (negative prompt)
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                disabled={processing}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm"
                placeholder="low quality, blurry, distorted..."
              />
            </div>

            {/* Refine Prompt Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="refine-prompt"
                checked={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.checked)}
                disabled={processing}
                className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-pink-500 focus:ring-pink-500"
              />
              <label htmlFor="refine-prompt" className="text-sm text-gray-400">
                Let AI refine my prompt for better results
              </label>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            {generatedUrl && previewUrl ? (
              <ImageComparison
                beforeImage={previewUrl}
                afterImage={generatedUrl}
                beforeLabel="Original"
                afterLabel="Generated Background"
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Original Image</h3>
                  <img src={previewUrl || undefined} alt="Original" className="w-full rounded-lg border border-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Generated Preview</h3>
                  <div className="w-full aspect-square bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                    {processing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">{progress}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Click "Generate Background" to process</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {!generatedUrl ? (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-12 py-5 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition shadow-xl shadow-pink-500/30"
              >
                {processing ? "Generating..." : "Generate Background"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="px-8 py-4 bg-pink-500 hover:bg-pink-600 rounded-lg font-semibold text-lg transition flex items-center gap-2 shadow-lg shadow-pink-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Image
                </button>
                <button
                  onClick={handleProcess}
                  disabled={processing}
                  className="px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
                >
                  Generate Again
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
