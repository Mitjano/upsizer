"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import ImageComparison from "./ImageComparison";
import { FaTimes, FaInfoCircle, FaPalette, FaMagic } from "react-icons/fa";

// Style presets that change scene/background while preserving identity
const STYLE_PRESETS = [
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌃', description: 'Neon city, futuristic vibes' },
  { id: 'fantasy', name: 'Fantasy', icon: '✨', description: 'Magical world, enchanted' },
  { id: 'professional', name: 'Professional', icon: '💼', description: 'Corporate portrait' },
  { id: 'anime', name: 'Anime', icon: '🎌', description: 'Japanese animation style' },
  { id: 'vintage', name: 'Vintage', icon: '📷', description: '1950s retro aesthetic' },
  { id: 'nature', name: 'Nature', icon: '🌲', description: 'Forest, golden hour' },
  { id: 'beach', name: 'Beach', icon: '🏖️', description: 'Tropical sunset paradise' },
  { id: 'urban', name: 'Urban', icon: '🏙️', description: 'City street photography' },
  { id: 'artistic', name: 'Artistic', icon: '🎨', description: 'Oil painting style' },
  { id: 'scifi', name: 'Sci-Fi', icon: '🚀', description: 'Space station, futuristic' },
  { id: 'custom', name: 'Custom', icon: '✏️', description: 'Write your own prompt' },
];

export default function StyleTransfer() {
  const { data: session } = useSession();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [styledUrl, setStyledUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: number} | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('cyberpunk');
  const [customPrompt, setCustomPrompt] = useState('');

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
    setStyledUrl(null);

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

    // Validate custom prompt if custom style selected
    if (selectedStyle === 'custom' && !customPrompt.trim()) {
      alert("Please enter a custom prompt for your style");
      return;
    }

    setProcessing(true);
    setProgress("Uploading image...");
    setStyledUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("style_preset", selectedStyle);
      if (selectedStyle === 'custom' && customPrompt) {
        formData.append("prompt", customPrompt);
      }

      const styleName = STYLE_PRESETS.find(s => s.id === selectedStyle)?.name || 'Style';
      setProgress(`Transforming to ${styleName} style (preserving your identity)...`);

      const response = await fetch("/api/style-transfer", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to apply style");
      }

      const data = await response.json();

      if (data.success && data.styledImage) {
        setProgress("Style transfer complete!");
        setStyledUrl(data.styledImage);
        setCreditsRemaining(data.creditsRemaining);
      } else {
        throw new Error("No styled image in response");
      }

    } catch (error: unknown) {
      console.error("Style transfer error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to apply style: ${errorMessage}`);
      setProgress("");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!styledUrl) return;

    try {
      const link = document.createElement("a");
      link.href = styledUrl;
      link.download = `pixelift_${selectedStyle}_${selectedFile?.name || "image.webp"}`;
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
    setStyledUrl(null);
    setProgress("");
    setImageInfo(null);
    setCustomPrompt('');
  };

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative border-2 border-dashed border-gray-600 rounded-2xl p-12 bg-gray-800/30">
          <div className="text-center">
            <div className="mb-6">
              <FaPalette className="mx-auto h-16 w-16 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Sign in to Use Style Diffusion</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Transform your photos into different scenes and styles while keeping your identity perfectly preserved.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/auth/signin" className="inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg font-medium transition">
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
      {/* Info Banner */}
      <div className="mb-6 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FaMagic className="text-pink-400 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-pink-300">Identity-Preserving Style Transfer</h4>
            <p className="text-sm text-gray-400 mt-1">
              Your face and identity stay exactly the same - only the scene, background, and artistic style change.
              Perfect for creating professional headshots, fantasy portraits, or placing yourself in any environment!
            </p>
          </div>
        </div>
      </div>

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
              <FaPalette className="mx-auto h-12 w-12 text-pink-400" />
            </div>

            <label htmlFor="file-upload" className="cursor-pointer inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg font-medium transition mb-4">
              Upload Your Photo
            </label>

            <p className="text-gray-400 mt-4">or drop image anywhere</p>
            <div className="mt-6 text-sm text-gray-500">
              <p className="mb-2">Best results with clear face photos - frontal view recommended</p>
              <p>Supported formats: PNG, JPEG, WEBP • Max size: 20MB</p>
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

          {/* Style Presets */}
          {!styledUrl && (
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaPalette className="text-pink-400" />
                Choose Scene / Style
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Select a style - your face will stay identical, only the scene changes!
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {STYLE_PRESETS.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      selectedStyle === style.id
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{style.icon}</div>
                    <div className="font-medium text-sm">{style.name}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{style.description}</div>
                  </button>
                ))}
              </div>

              {/* Custom Prompt - only show when custom is selected */}
              {selectedStyle === 'custom' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Describe your custom scene/style:
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., 'portrait in a cozy coffee shop, warm lighting, autumn vibes' or 'on the moon surface, astronaut suit, Earth in background'"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:border-pink-500 focus:outline-none resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Tip: Describe the scene, environment, lighting, and mood. Your face will be preserved automatically.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            {styledUrl && previewUrl ? (
              <ImageComparison
                beforeImage={previewUrl}
                afterImage={styledUrl}
                beforeLabel="Original"
                afterLabel={`${STYLE_PRESETS.find(s => s.id === selectedStyle)?.name || 'Styled'}`}
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Your Photo</h3>
                  <img src={previewUrl || undefined} alt="Original" className="w-full rounded-lg border border-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Styled Result</h3>
                  <div className="w-full aspect-square bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                    {processing ? (
                      <div className="text-center p-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                        <p className="text-gray-400">{progress}</p>
                        <p className="text-xs text-gray-500 mt-2">This may take 20-40 seconds...</p>
                      </div>
                    ) : (
                      <div className="text-center p-6">
                        <FaMagic className="mx-auto h-10 w-10 text-gray-500 mb-3" />
                        <p className="text-gray-500">Select a style and click &quot;Transform&quot;</p>
                        <p className="text-xs text-gray-600 mt-2">Your identity will be perfectly preserved</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {!styledUrl ? (
              <button
                onClick={handleProcess}
                disabled={processing || (selectedStyle === 'custom' && !customPrompt.trim())}
                className="px-12 py-5 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition shadow-xl shadow-pink-500/30"
              >
                {processing ? "Transforming..." : `Transform to ${STYLE_PRESETS.find(s => s.id === selectedStyle)?.name}`}
              </button>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-lg font-semibold text-lg transition flex items-center gap-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Image
                </button>
                <button
                  onClick={() => setStyledUrl(null)}
                  disabled={processing}
                  className="px-6 py-4 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition"
                >
                  Try Different Style
                </button>
              </>
            )}
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              Upload New Photo
            </button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>Powered by InstantID + IPAdapter AI - Your face stays identical - 4 credits per transform</p>
          </div>
        </div>
      )}
    </div>
  );
}
