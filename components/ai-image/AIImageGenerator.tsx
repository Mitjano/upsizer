'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ModelSelector from './ModelSelector';
import AspectRatioSelector from './AspectRatioSelector';
import ImageCountSelector from './ImageCountSelector';
import StyleSelector from './StyleSelector';
import ProgressIndicator from './ProgressIndicator';
import SeedInput from './SeedInput';
import GeneratedImageActions from './GeneratedImageActions';
import PromptExamples from './PromptExamples';
import {
  AI_MODELS,
  ASPECT_RATIOS,
  DEFAULT_MODEL,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_IMAGE_COUNT,
  getModelById,
  getAspectRatioById,
  calculateCredits,
  type AIImageMode,
  type ImageCount,
} from '@/lib/ai-image/models';
import { DEFAULT_STYLE, getStyleById } from '@/lib/ai-image/styles';

interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  seed?: number;
}

export default function AIImageGenerator() {
  const t = useTranslations('aiImage');
  const { data: session } = useSession();

  // Form state
  const [mode, setMode] = useState<AIImageMode>('text-to-image');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [imageCount, setImageCount] = useState<ImageCount>(DEFAULT_IMAGE_COUNT);
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  // Seed control
  const [seed, setSeed] = useState('');
  const [useRandomSeed, setUseRandomSeed] = useState(true);
  const [lastSeed, setLastSeed] = useState<number | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Enhance prompt state
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);

  // UI state
  const [showExamples, setShowExamples] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedModel = getModelById(model);
  const selectedAspectRatio = getAspectRatioById(aspectRatio);
  const creditsRequired = calculateCredits(model, imageCount);

  const handleModeChange = (newMode: AIImageMode) => {
    setMode(newMode);
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
      toast.error(t('errors.invalidImage') || 'Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('errors.imageTooLarge') || 'Image must be less than 10MB');
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

  const handleEnhancePrompt = async () => {
    if (!session) {
      toast.error(t('errors.signInRequired') || 'Please sign in to enhance prompts');
      return;
    }

    if (!prompt.trim() || prompt.trim().length < 3) {
      toast.error(t('errors.promptTooShort') || 'Enter at least 3 characters to enhance');
      return;
    }

    setEnhancing(true);
    setEnhancedPrompt(null);

    try {
      const response = await fetch('/api/ai-image/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to enhance prompt');
        return;
      }

      setEnhancedPrompt(data.enhanced);
    } catch (error) {
      console.error('Enhance error:', error);
      toast.error('Failed to enhance prompt');
    } finally {
      setEnhancing(false);
    }
  };

  const applyEnhancedPrompt = () => {
    if (enhancedPrompt) {
      setPrompt(enhancedPrompt);
      setEnhancedPrompt(null);
      toast.success(t('enhance.applied') || 'Enhanced prompt applied!');
    }
  };

  const handleGenerate = async () => {
    if (!session) {
      toast.error(t('errors.signInRequired') || 'Please sign in to generate images');
      return;
    }

    if (!prompt.trim()) {
      toast.error(t('errors.promptRequired') || 'Please enter a prompt');
      return;
    }

    if (mode === 'image-to-image' && !sourceImage) {
      toast.error(t('errors.sourceImageRequired') || 'Please upload a source image');
      return;
    }

    setGenerating(true);
    setGeneratedImages([]);
    setSelectedImageIndex(0);

    try {
      const response = await fetch('/api/ai-image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          mode,
          model,
          aspectRatio,
          style,
          numImages: imageCount,
          sourceImage: mode === 'image-to-image' ? sourceImage : undefined,
          seed: !useRandomSeed && seed ? parseInt(seed) : undefined,
          isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast.error(`${t('errors.insufficientCredits') || 'Insufficient credits'}. ${t('errors.need') || 'Need'} ${data.required}, ${t('errors.have') || 'have'} ${data.available}`);
        } else {
          toast.error(data.error || 'Generation failed');
        }
        return;
      }

      // Update generated images with seed
      const imagesWithSeed = data.images.map((img: GeneratedImage) => ({
        ...img,
        seed: data.seed || img.seed,
      }));

      setGeneratedImages(imagesWithSeed);
      if (data.seed) {
        setLastSeed(data.seed);
      }
      toast.success(`${t('success.generated') || 'Generated'} ${data.images.length} ${t('success.images') || 'image(s)'}! ${t('success.used') || 'Used'} ${data.creditsUsed} ${t('success.credits') || 'credits'}`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(t('errors.generationFailed') || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const handleRemix = useCallback((settings: { prompt: string; model: string; style: string; aspectRatio: string }) => {
    setPrompt(settings.prompt);
    setModel(settings.model);
    setStyle(settings.style);
    setAspectRatio(settings.aspectRatio);
    // Keep seed for remix
    if (lastSeed) {
      setSeed(String(lastSeed));
      setUseRandomSeed(false);
    }
  }, [lastSeed]);

  const currentImage = generatedImages[selectedImageIndex];

  return (
    <div className="bg-gray-900/50 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="flex flex-col lg:flex-row min-h-[600px]">

        {/* LEFT PANEL - Controls */}
        <div className="lg:w-[420px] xl:w-[460px] border-b lg:border-b-0 lg:border-r border-gray-800 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* Mode Toggle */}
            <div className="flex rounded-xl bg-gray-800/50 p-1">
              <button
                onClick={() => handleModeChange('text-to-image')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
                  mode === 'text-to-image'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>✏️</span>
                {t('mode.textToImage') || 'Text to Image'}
              </button>
              <button
                onClick={() => handleModeChange('image-to-image')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm ${
                  mode === 'image-to-image'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span>🖼️</span>
                {t('mode.imageToImage') || 'Image to Image'}
              </button>
            </div>

            {/* Source Image Upload (for image-to-image) */}
            {mode === 'image-to-image' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  {t('sourceImage.label') || 'Source Image'}
                </label>
                {sourceImagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={sourceImagePreview}
                      alt="Source"
                      className="max-h-32 rounded-lg border border-gray-600"
                    />
                    <button
                      onClick={removeSourceImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition text-sm"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500/50 transition"
                  >
                    <div className="text-3xl mb-2">📤</div>
                    <p className="text-gray-400 text-sm">{t('sourceImage.upload') || 'Click to upload'}</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (max 10MB)</p>
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

            {/* Prompt Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  {t('prompt.label') || 'Prompt'}
                </label>
                <span className="text-xs text-gray-500">{prompt.length}/2000</span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (enhancedPrompt) setEnhancedPrompt(null);
                }}
                placeholder={
                  mode === 'text-to-image'
                    ? t('prompt.placeholderText') || 'A majestic lion in golden savanna, sunset lighting, 8k photography...'
                    : t('prompt.placeholderImage') || 'Transform this image into a watercolor painting...'
                }
                className="w-full h-28 px-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-white placeholder-gray-500 text-sm leading-relaxed"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEnhancePrompt}
                  disabled={enhancing || !prompt.trim() || prompt.trim().length < 3}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  {enhancing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('enhance.enhancing') || 'Enhancing...'}
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      {t('enhance.button') || 'Enhance'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowExamples(true)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 text-gray-400 hover:text-white"
                >
                  <span>💡</span>
                  {t('examples.button') || 'Examples'}
                </button>
              </div>

              {/* Enhanced Prompt Preview */}
              {enhancedPrompt && (
                <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-400 font-medium text-xs">✨ {t('enhance.enhanced') || 'Enhanced'}:</span>
                  </div>
                  <p className="text-gray-300 text-xs mb-2 leading-relaxed line-clamp-3">{enhancedPrompt}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={applyEnhancedPrompt}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black font-medium text-xs rounded-lg transition"
                    >
                      {t('enhance.use') || 'Use This'}
                    </button>
                    <button
                      onClick={() => setEnhancedPrompt(null)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-lg transition"
                    >
                      {t('enhance.cancel') || 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Model Selection */}
            <ModelSelector
              mode={mode}
              value={model}
              onChange={setModel}
            />

            {/* Style Selection */}
            <StyleSelector
              value={style}
              onChange={setStyle}
            />

            {/* Aspect Ratio */}
            <AspectRatioSelector
              value={aspectRatio}
              onChange={setAspectRatio}
            />

            {/* Image Count */}
            <ImageCountSelector
              value={imageCount}
              onChange={setImageCount}
              creditsPerImage={selectedModel?.credits || 0}
            />

            {/* Advanced Options */}
            <div className="border-t border-gray-800 pt-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-sm text-gray-400 hover:text-white transition"
              >
                <span className="flex items-center gap-2">
                  <span>⚙️</span>
                  {t('advanced.title') || 'Advanced Options'}
                </span>
                <span className={`transform transition text-xs ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  {/* Negative Prompt */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400">
                      {t('advanced.negativePrompt') || 'Negative Prompt'}
                    </label>
                    <textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="blurry, low quality, distorted, deformed..."
                      className="w-full h-16 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm resize-none text-white placeholder-gray-500"
                      maxLength={1000}
                    />
                  </div>

                  {/* Seed Control */}
                  <SeedInput
                    value={seed}
                    onChange={setSeed}
                    useRandom={useRandomSeed}
                    onUseRandomChange={setUseRandomSeed}
                    lastSeed={lastSeed}
                  />

                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{isPublic ? '🌐' : '🔒'}</span>
                      <span className="text-sm text-gray-300">
                        {isPublic
                          ? (t('visibility.public') || 'Public')
                          : (t('visibility.private') || 'Private')}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      className={`w-12 h-6 rounded-full transition relative ${
                        isPublic ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        isPublic ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            {session ? (
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim() || (mode === 'image-to-image' && !sourceImage)}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-3"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t('generate.generating') || 'Generating...'}
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    {t('generate.button') || 'Generate'} ({creditsRequired} {t('generate.credits') || 'credits'})
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-lg transition text-center block"
              >
                {t('generate.signIn') || 'Sign in to Generate'}
              </Link>
            )}

          </div>
        </div>

        {/* RIGHT PANEL - Preview & Results */}
        <div className="flex-1 flex flex-col bg-gray-950/30 min-h-[400px]">
          <div className="flex-1 p-5 flex flex-col">

            {/* Main Preview Area */}
            <div className="flex-1 flex items-center justify-center">
              {generating ? (
                // Generating State
                <div className="text-center space-y-6 max-w-md w-full px-4">
                  <div className="relative w-48 h-48 mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl animate-pulse" />
                    <div className="absolute inset-4 bg-gray-800/50 rounded-xl flex items-center justify-center">
                      <div className="text-6xl animate-bounce">🎨</div>
                    </div>
                  </div>
                  <ProgressIndicator
                    isGenerating={generating}
                    estimatedTime={selectedModel?.credits === 1 ? 5 : 10}
                  />
                </div>
              ) : generatedImages.length > 0 && currentImage ? (
                // Generated Images
                <div className="space-y-4 w-full max-w-2xl">
                  {/* Main Image */}
                  <div className="relative group">
                    <img
                      src={currentImage.url}
                      alt="Generated image"
                      className="w-full rounded-2xl border border-gray-700 shadow-2xl"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition rounded-2xl flex items-center justify-center">
                      <a
                        href={currentImage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2"
                      >
                        <span>🔍</span> {t('preview.viewFull') || 'View Full'}
                      </a>
                    </div>
                  </div>

                  {/* Multi-image selector */}
                  {generatedImages.length > 1 && (
                    <div className="flex justify-center gap-2">
                      {generatedImages.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                            selectedImageIndex === idx
                              ? 'border-purple-500 ring-2 ring-purple-500/30'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <img
                            src={img.thumbnailUrl || img.url}
                            alt={`Generated ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <GeneratedImageActions
                    image={currentImage}
                    settings={{
                      prompt,
                      model,
                      modelName: selectedModel?.name || model,
                      style,
                      styleName: getStyleById(style)?.name || 'None',
                      aspectRatio,
                      width: selectedAspectRatio?.width || 1024,
                      height: selectedAspectRatio?.height || 1024,
                      seed: currentImage.seed,
                    }}
                    onRemix={handleRemix}
                  />
                </div>
              ) : (
                // Empty State
                <div className="text-center space-y-4 max-w-sm px-4">
                  <div className="w-24 h-24 mx-auto rounded-2xl bg-gray-800/50 flex items-center justify-center">
                    <span className="text-4xl opacity-50">🎨</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300">
                    {t('empty.title') || 'Ready to Create'}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {t('empty.description') || 'Enter a prompt and click Generate to create your AI image'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <button
                      onClick={() => setPrompt('cyberpunk city at night, neon lights, rain')}
                      className="px-3 py-1 bg-gray-800/50 hover:bg-gray-700/50 rounded-full text-xs text-gray-400 hover:text-white transition"
                    >
                      cyberpunk city
                    </button>
                    <button
                      onClick={() => setPrompt('fantasy portrait, ethereal lighting, magical')}
                      className="px-3 py-1 bg-gray-800/50 hover:bg-gray-700/50 rounded-full text-xs text-gray-400 hover:text-white transition"
                    >
                      fantasy portrait
                    </button>
                    <button
                      onClick={() => setPrompt('abstract fluid art, vibrant colors, cosmic')}
                      className="px-3 py-1 bg-gray-800/50 hover:bg-gray-700/50 rounded-full text-xs text-gray-400 hover:text-white transition"
                    >
                      abstract art
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Prompt Examples Modal */}
      {showExamples && (
        <PromptExamples
          onSelectPrompt={(p) => setPrompt(p)}
          onClose={() => setShowExamples(false)}
        />
      )}
    </div>
  );
}
