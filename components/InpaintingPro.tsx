"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { FaTimes, FaInfoCircle, FaPaintBrush, FaUndo } from "react-icons/fa";
import { LoginPrompt, CreditCostBadge } from "./shared";
import { CREDIT_COSTS } from '@/lib/credits-config';

export default function InpaintingPro() {
  const { data: session } = useSession();
  const t = useTranslations('components.loginPrompt.inpaintingPro');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: number} | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [prompt, setPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(30);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        setPreviewUrl(reader.result as string);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Initialize canvases when image loads
  useEffect(() => {
    if (!previewUrl || !canvasRef.current || !maskCanvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const maskCanvas = maskCanvasRef.current!;
      const container = containerRef.current!;

      // Calculate display size (max 600px width)
      const maxWidth = Math.min(600, container.clientWidth - 48);
      const scale = maxWidth / img.width;
      const displayWidth = img.width * scale;
      const displayHeight = img.height * scale;

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

      const maskCtx = maskCanvas.getContext('2d')!;
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, img.width, img.height);
    };
    img.src = previewUrl;
  }, [previewUrl]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !maskCanvasRef.current || !previewUrl) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const maskCtx = maskCanvas.getContext('2d')!;

    const pos = getMousePos(e);
    const scale = maskCanvas.width / canvas.width;

    // Draw on display canvas (semi-transparent red)
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.fill();

    // Draw on mask canvas (white = area to inpaint)
    maskCtx.beginPath();
    maskCtx.arc(pos.x * scale, pos.y * scale, (brushSize / 2) * scale, 0, Math.PI * 2);
    maskCtx.fillStyle = 'white';
    maskCtx.fill();
  };

  const clearMask = () => {
    if (!canvasRef.current || !maskCanvasRef.current || !previewUrl) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const maskCtx = maskCanvas.getContext('2d')!;

    // Redraw original image
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = previewUrl;

    // Clear mask
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
  };

  const getMaskBlob = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!maskCanvasRef.current) {
        reject(new Error('Mask canvas not ready'));
        return;
      }
      maskCanvasRef.current.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create mask blob'));
      }, 'image/png');
    });
  };

  const handleProcess = async () => {
    if (!selectedFile || !maskCanvasRef.current || !imageInfo) return;

    setProcessing(true);
    setProgress("Preparing mask...");
    setProcessedUrl(null);

    try {
      // Check if mask has any white pixels (areas to inpaint)
      const maskCanvas = maskCanvasRef.current;
      const maskCtx = maskCanvas.getContext('2d')!;
      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const hasWhitePixels = Array.from(maskData.data).some((val, i) => i % 4 === 0 && val > 128);

      if (!hasWhitePixels) {
        alert("Please draw over the area you want to modify (paint red areas on the image)");
        setProcessing(false);
        setProgress("");
        return;
      }

      const maskBlob = await getMaskBlob();

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mask", maskBlob, "mask.png");
      formData.append("prompt", prompt || "seamless natural fill, high quality, detailed");
      formData.append("mode", "inpaint");

      setProgress("Processing with FLUX Fill Pro AI...");

      const response = await fetch("/api/inpainting", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process inpainting");
      }

      const data = await response.json();

      if (data.success && data.processedImage) {
        setProgress("Inpainting complete!");
        setProcessedUrl(data.processedImage);
        setCreditsRemaining(data.creditsRemaining);
      } else {
        throw new Error("No processed image in response");
      }

    } catch (error: unknown) {
      console.error("Inpainting error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to process inpainting: ${errorMessage}`);
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
      link.download = `pixelift_inpainted_${selectedFile?.name || "image.png"}`;
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
    setPrompt("");
  };

  if (!session) {
    return (
      <LoginPrompt
        title={t('title')}
        description={t('description')}
        callbackUrl="/tools/inpainting"
        accentColor="cyan"
        features={["3 Free Credits", "No Credit Card", "AI-Powered"]}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto" ref={containerRef}>
      {!previewUrl ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
            dragActive ? "border-cyan-500 bg-cyan-500/10" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
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
              <FaPaintBrush className="mx-auto h-12 w-12 text-cyan-400" />
            </div>

            <label htmlFor="file-upload" className="cursor-pointer inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-medium transition mb-4">
              Upload Image for AI Inpainting
            </label>

            <p className="text-gray-600 dark:text-gray-400 mt-4">or drop image anywhere</p>
            <div className="mt-6 text-sm text-gray-500 dark:text-gray-500">
              <p className="mb-2">Supported formats: PNG, JPEG, JPG, WEBP</p>
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
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/30 rounded-lg p-3">
              <FaInfoCircle className="text-cyan-400" />
              <span>{imageInfo.width} x {imageInfo.height} px</span>
              <span>-</span>
              <span>{(imageInfo.size / 1024 / 1024).toFixed(2)} MB</span>
              {creditsRemaining !== null && (
                <>
                  <span>-</span>
                  <span className="text-cyan-400">{creditsRemaining} credits remaining</span>
                </>
              )}
            </div>
          )}

          {!processedUrl ? (
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <FaPaintBrush className="text-cyan-400" />
                Draw Over Areas to Fill/Replace
              </h3>

              {/* Tools */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Brush Size:</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-500">{brushSize}px</span>
                </div>
                <button
                  onClick={clearMask}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
                >
                  <FaUndo />
                  Clear Mask
                </button>
              </div>

              {/* Canvas */}
              <div className="relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden inline-block">
                <canvas
                  ref={canvasRef}
                  onMouseDown={() => setIsDrawing(true)}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                  onMouseMove={draw}
                  className="cursor-crosshair"
                  style={{ maxWidth: '100%' }}
                />
                <canvas ref={maskCanvasRef} className="hidden" />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Paint red over the areas you want to fill or replace
              </p>

              {/* Prompt */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  What should appear in the painted area?
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'a beautiful garden', 'clear blue sky', 'wooden texture'"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-cyan-500 focus:outline-none text-gray-900 dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="relative">
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
                    Przed
                  </div>
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="w-full h-auto rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                </div>
                {/* After */}
                <div className="relative">
                  <div className="absolute top-2 left-2 bg-cyan-500/80 text-white text-xs px-2 py-1 rounded z-10">
                    Po
                  </div>
                  <img
                    src={processedUrl}
                    alt="Inpainted"
                    className="w-full h-auto rounded-lg border border-cyan-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {!processedUrl ? (
              <button
                onClick={handleProcess}
                disabled={processing}
                className="px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition shadow-xl shadow-cyan-500/30"
              >
                {processing ? progress : "Fill with AI"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg font-semibold text-lg transition flex items-center gap-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Result
                </button>
                <button
                  onClick={() => setProcessedUrl(null)}
                  disabled={processing}
                  className="px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
                >
                  Edit Again
                </button>
              </>
            )}
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              Upload New Image
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-500 flex items-center justify-center gap-2">
            <span>Powered by FLUX Fill Pro AI -</span>
            <CreditCostBadge tool="inpainting" size="xs" />
            <span>per inpainting</span>
          </div>
        </div>
      )}
    </div>
  );
}
