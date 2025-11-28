'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ModelSelector from './ModelSelector';
import AspectRatioSelector from './AspectRatioSelector';
import ImageCountSelector from './ImageCountSelector';
import {
  AI_MODELS,
  ASPECT_RATIOS,
  DEFAULT_MODEL,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_IMAGE_COUNT,
  getModelById,
  calculateCredits,
  type AIImageMode,
  type ImageCount,
} from '@/lib/ai-image/models';

interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
}

export default function AIImageGenerator() {
  const { data: session } = useSession();
  const [mode, setMode] = useState<AIImageMode>('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [imageCount, setImageCount] = useState<ImageCount>(DEFAULT_IMAGE_COUNT);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = getModelById(model);
  const creditsRequired = calculateCredits(model, imageCount);

  const handleModeChange = (newMode: AIImageMode) => {
    setMode(newMode);
    // Reset model if current model doesn't support new mode
    if (selectedModel && !selectedModel.modes.includes(newMode)) {
      const defaultModelForMode = AI_MODELS.find(m => m.modes.includes(newMode));
      if (defaultModelForMode) {
        setModel(defaultModelForMode.id);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSourceImage(base64);
      setSourceImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeSourceImage = () => {
    setSourceImage(null);
    setSourceImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!session) {
      toast.error('Please sign in to generate images');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (mode === 'image-to-image' && !sourceImage) {
      toast.error('Please upload a source image');
      return;
    }

    setGenerating(true);
    setGeneratedImages([]);

    try {
      const response = await fetch('/api/ai-image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
          model,
          aspectRatio,
          numImages: imageCount,
          sourceImage: mode === 'image-to-image' ? sourceImage : undefined,
          isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast.error(`Insufficient credits. Need ${data.required}, have ${data.available}`);
        } else {
          toast.error(data.error || 'Generation failed');
        }
        return;
      }

      setGeneratedImages(data.images);
      toast.success(`Generated ${data.images.length} image(s)! Used ${data.creditsUsed} credits`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      {/* Mode Toggle */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => handleModeChange('text-to-image')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition ${
            mode === 'text-to-image'
              ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
          }`}
        >
          <span>✏️</span>
          Text to Image
        </button>
        <button
          onClick={() => handleModeChange('image-to-image')}
          className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition ${
            mode === 'image-to-image'
              ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
          }`}
        >
          <span>🖼️</span>
          Image to Image
        </button>
      </div>

      <div className="p-6">
        {/* Prompt Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Describe the image you want to create
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'text-to-image'
                ? 'A serene mountain landscape at sunset with golden light reflecting on a crystal-clear lake...'
                : 'Transform this image into a watercolor painting style...'
            }
            className="w-full h-32 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-white placeholder-gray-500"
            maxLength={2000}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {prompt.length}/2000 characters
            </span>
          </div>
        </div>

        {/* Source Image Upload (for image-to-image) */}
        {mode === 'image-to-image' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Source Image
            </label>
            {sourceImagePreview ? (
              <div className="relative inline-block">
                <img
                  src={sourceImagePreview}
                  alt="Source"
                  className="max-h-48 rounded-lg border border-gray-600"
                />
                <button
                  onClick={removeSourceImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition"
              >
                <div className="text-4xl mb-2">📤</div>
                <p className="text-gray-400">Click to upload an image</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 10MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Options Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <ModelSelector
            mode={mode}
            value={model}
            onChange={setModel}
          />
          <AspectRatioSelector
            value={aspectRatio}
            onChange={setAspectRatio}
          />
          <ImageCountSelector
            value={imageCount}
            onChange={setImageCount}
            creditsPerImage={selectedModel?.credits || 0}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Visibility
            </label>
            <button
              onClick={() => setIsPublic(!isPublic)}
              className={`w-full px-4 py-2.5 rounded-lg border transition flex items-center justify-center gap-2 ${
                isPublic
                  ? 'bg-green-600/20 border-green-500 text-green-400'
                  : 'bg-gray-700 border-gray-600 text-gray-300'
              }`}
            >
              {isPublic ? '🌐 Public' : '🔒 Private'}
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {session ? (
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim() || (mode === 'image-to-image' && !sourceImage)}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  ✨ Generate ({creditsRequired} credits)
                </>
              )}
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition text-center"
            >
              Sign in to Generate
            </Link>
          )}
          <p className="text-sm text-gray-500">
            {selectedModel?.name} • {ASPECT_RATIOS.find(ar => ar.id === aspectRatio)?.name}
          </p>
        </div>

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Generated Images</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {generatedImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.url}
                    alt="Generated"
                    className="w-full rounded-lg border border-gray-600"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                    <a
                      href={img.url}
                      download={`pixelift-${img.id}.png`}
                      className="px-3 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                    >
                      Download
                    </a>
                    <Link
                      href={`/ai-image/${img.id}`}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
