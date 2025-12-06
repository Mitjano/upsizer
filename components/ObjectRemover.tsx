"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { FaTimes, FaInfoCircle, FaUndo, FaEraser, FaPaintBrush } from "react-icons/fa";
import { LoginPrompt, CreditCostBadge } from "./shared";
import { CREDIT_COSTS } from '@/lib/credits-config';

export default function ObjectRemover() {
  const { data: session } = useSession();
  const t = useTranslations('components.loginPrompt.objectRemover');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: number} | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  // Drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [paths, setPaths] = useState<{x: number, y: number}[][]>([]);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);

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
    setPaths([]);
    setCurrentPath([]);

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

  // Initialize canvas when preview is loaded
  useEffect(() => {
    if (previewUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = previewUrl;
    }
  }, [previewUrl]);

  // Redraw canvas with paths
  useEffect(() => {
    if (!canvasRef.current || !previewUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);

      // Draw all paths
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      [...paths, currentPath].forEach(path => {
        if (path.length > 0) {
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          path.forEach(point => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
      });
    };
    img.src = previewUrl;
  }, [paths, currentPath, previewUrl, brushSize]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    setCurrentPath([coords]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoordinates(e);
    setCurrentPath(prev => [...prev, coords]);
  };

  const stopDrawing = () => {
    if (currentPath.length > 0) {
      setPaths(prev => [...prev, currentPath]);
    }
    setCurrentPath([]);
    setIsDrawing(false);
  };

  const undoLastStroke = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const clearMask = () => {
    setPaths([]);
    setCurrentPath([]);
  };

  const generateMask = async (): Promise<Blob | null> => {
    if (!canvasRef.current || !imageInfo) return null;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = imageInfo.width;
    maskCanvas.height = imageInfo.height;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return null;

    // Fill with black (areas to keep)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw white strokes (areas to remove)
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    paths.forEach(path => {
      if (path.length > 0) {
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        path.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
    });

    return new Promise(resolve => {
      maskCanvas.toBlob(resolve, 'image/png');
    });
  };

  const handleProcess = async () => {
    if (!selectedFile || paths.length === 0) {
      alert("Please draw over the object you want to remove");
      return;
    }

    setProcessing(true);
    setProgress("Generating mask...");
    setProcessedUrl(null);

    try {
      const maskBlob = await generateMask();
      if (!maskBlob) throw new Error("Failed to generate mask");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("mask", maskBlob, "mask.png");

      setProgress("Removing object with BRIA Eraser AI...");

      const response = await fetch("/api/object-removal", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove object");
      }

      const data = await response.json();

      if (data.success && data.processedImage) {
        setProgress("Object removal complete!");
        setProcessedUrl(data.processedImage);
        setCreditsRemaining(data.creditsRemaining);
      } else {
        throw new Error("No processed image in response");
      }

    } catch (error: any) {
      console.error("Object removal error:", error);
      alert(`Failed to remove object: ${error.message}`);
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
      link.download = `pixelift_object_removed_${selectedFile?.name || "image.png"}`;
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
    setPaths([]);
    setCurrentPath([]);
  };

  if (!session) {
    return (
      <LoginPrompt
        title={t('title')}
        description={t('description')}
        callbackUrl="/tools/object-removal"
        accentColor="orange"
        features={["3 Free Credits", "No Credit Card", "AI-Powered"]}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {!previewUrl ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
            dragActive ? "border-orange-500 bg-orange-500/10" : "border-gray-600 hover:border-gray-500"
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

            <label htmlFor="file-upload" className="cursor-pointer inline-block px-8 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition mb-4">
              Upload Image
            </label>

            <p className="text-gray-400 mt-4">or drop image anywhere</p>
            <div className="mt-6 text-sm text-gray-500">
              <p className="mb-2">Supported formats: png | jpeg | jpg | webp</p>
              <p className="mb-2">Maximum file size: 20MB</p>
              <CreditCostBadge tool="object_removal" size="md" />
            </div>
          </div>
        </div>
      ) : !processedUrl ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              <FaInfoCircle className="inline mr-2 text-orange-400" />
              Draw over the object you want to remove
            </div>
            <button onClick={handleReset} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500 transition">
              <FaTimes className="text-red-500" />
            </button>
          </div>

          {/* Drawing Tools */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FaPaintBrush className="text-orange-400" />
              <span className="text-sm text-gray-400">Brush Size:</span>
              <input
                type="range"
                min="10"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-400">{brushSize}px</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={undoLastStroke}
                disabled={paths.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition"
              >
                <FaUndo /> Undo
              </button>
              <button
                onClick={clearMask}
                disabled={paths.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition"
              >
                <FaEraser /> Clear
              </button>
            </div>
          </div>

          {/* Canvas for drawing */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="relative overflow-auto max-h-[600px]">
              <canvas
                ref={canvasRef}
                className="max-w-full cursor-crosshair rounded-lg"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleProcess}
              disabled={processing || paths.length === 0}
              className="px-12 py-5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition shadow-xl shadow-orange-500/30"
            >
              {processing ? "Processing..." : "Remove Object"}
            </button>
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              Upload New Image
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={handleReset} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500 transition">
              <FaTimes className="text-red-500" />
            </button>
          </div>

          {creditsRemaining !== null && (
            <div className="flex items-center gap-4 text-sm text-gray-400 bg-gray-800/30 rounded-lg p-3">
              <FaInfoCircle className="text-orange-400" />
              <span className="text-orange-400">{creditsRemaining} credits remaining</span>
            </div>
          )}

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Original Image</h3>
                <img src={previewUrl || undefined} alt="Original" className="w-full rounded-lg border border-gray-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Object Removed</h3>
                <img src={processedUrl} alt="Processed" className="w-full rounded-lg border border-gray-600" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleDownload}
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold text-lg transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Image
            </button>
            <button
              onClick={() => { setProcessedUrl(null); setPaths([]); }}
              className="px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
            >
              Edit Again
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
            >
              Upload New Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
