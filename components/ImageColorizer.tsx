"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import ImageComparison from "./ImageComparison";
import { FaTimes, FaInfoCircle } from "react-icons/fa";
import { LoginPrompt, CreditCostBadge } from "./shared";
import { CREDIT_COSTS } from '@/lib/credits-config';

export default function ImageColorizer() {
  const { data: session } = useSession();
  const t = useTranslations('components.loginPrompt.imageColorizer');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [colorizedUrl, setColorizedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: number} | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

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
    setColorizedUrl(null);

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
    setColorizedUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      setProgress("Colorizing with DDColor AI...");

      const response = await fetch("/api/colorize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to colorize image");
      }

      const data = await response.json();

      if (data.success && data.colorizedImage) {
        setProgress("Colorization complete!");
        setColorizedUrl(data.colorizedImage);
        setCreditsRemaining(data.creditsRemaining);
      } else {
        throw new Error("No colorized image in response");
      }

    } catch (error: any) {
      console.error("Colorize error:", error);
      alert(`Failed to colorize image: ${error.message}`);
      setProgress("");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!colorizedUrl) return;

    try {
      const link = document.createElement("a");
      link.href = colorizedUrl;
      link.download = `pixelift_colorized_${selectedFile?.name || "image.png"}`;
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
    setColorizedUrl(null);
    setProgress("");
    setImageInfo(null);
  };

  if (!session) {
    return (
      <LoginPrompt
        title={t('title')}
        description={t('description')}
        callbackUrl="/tools/colorize"
        accentColor="purple"
        features={["3 Free Credits", "No Credit Card", "AI-Powered"]}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {!previewUrl ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
            dragActive ? "border-purple-500 bg-purple-500/10" : "border-gray-600 hover:border-gray-500"
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

            <label htmlFor="file-upload" className="cursor-pointer inline-block px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition mb-4">
              Upload Black & White Image
            </label>

            <p className="text-gray-400 mt-4">or drop image anywhere</p>
            <div className="mt-6 text-sm text-gray-500">
              <p className="mb-2">Supported formats: png | jpeg | jpg | webp</p>
              <p className="mb-2">Maximum file size: 20MB</p>
              <CreditCostBadge tool="colorize" size="md" />
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
              <FaInfoCircle className="text-purple-400" />
              <span>{imageInfo.width} x {imageInfo.height} px</span>
              <span>-</span>
              <span>{(imageInfo.size / 1024 / 1024).toFixed(2)} MB</span>
              {creditsRemaining !== null && (
                <>
                  <span>-</span>
                  <span className="text-purple-400">{creditsRemaining} credits remaining</span>
                </>
              )}
            </div>
          )}

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            {colorizedUrl && previewUrl ? (
              <ImageComparison
                beforeImage={previewUrl}
                afterImage={colorizedUrl}
                beforeLabel="Original B&W"
                afterLabel="AI Colorized"
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Original Image</h3>
                  <img src={previewUrl || undefined} alt="Original" className="w-full rounded-lg border border-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Colorized Preview</h3>
                  <div className="w-full aspect-square bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                    {processing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">{progress}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500">Click "Colorize Image" to process</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {!colorizedUrl ? (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-12 py-5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition shadow-xl shadow-purple-500/30"
              >
                {processing ? "Colorizing..." : "Colorize Image"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="px-8 py-4 bg-purple-500 hover:bg-purple-600 rounded-lg font-semibold text-lg transition flex items-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Colorized Image
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
