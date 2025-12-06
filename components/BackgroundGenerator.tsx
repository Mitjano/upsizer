"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import ImageComparison from "./ImageComparison";
import { FaTimes, FaInfoCircle, FaMagic, FaShoppingCart, FaCamera, FaTree, FaSnowflake, FaUtensils, FaGem, FaPalette, FaHome } from "react-icons/fa";
import { LoginPrompt, CreditCostBadge } from "./shared";
import { CREDIT_COSTS } from '@/lib/credits-config';

// Category definitions with icons and colors
const PRESET_CATEGORIES = [
  { id: 'ecommerce', label: 'E-commerce', icon: FaShoppingCart, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'studio', label: 'Studio', icon: FaCamera, gradient: 'from-gray-500 to-gray-700' },
  { id: 'lifestyle', label: 'Lifestyle', icon: FaHome, gradient: 'from-amber-500 to-orange-500' },
  { id: 'nature', label: 'Nature', icon: FaTree, gradient: 'from-green-500 to-emerald-500' },
  { id: 'seasonal', label: 'Seasonal', icon: FaSnowflake, gradient: 'from-sky-400 to-blue-500' },
  { id: 'food', label: 'Food & Drink', icon: FaUtensils, gradient: 'from-red-500 to-rose-500' },
  { id: 'luxury', label: 'Luxury', icon: FaGem, gradient: 'from-purple-500 to-pink-500' },
  { id: 'creative', label: 'Creative', icon: FaPalette, gradient: 'from-pink-500 to-violet-500' },
];

// Comprehensive presets organized by category
const PRESETS_BY_CATEGORY: Record<string, Array<{ label: string; prompt: string; negativePrompt: string }>> = {
  ecommerce: [
    { label: "Pure White", prompt: "pure white seamless studio background, e-commerce product photography, professional lighting, clean minimal, Amazon style listing photo", negativePrompt: "shadows, gradient, texture, patterns, objects, distractions" },
    { label: "Light Gray", prompt: "light gray seamless studio background, soft professional lighting, e-commerce product shot, neutral clean backdrop", negativePrompt: "harsh shadows, color cast, gradients, textures" },
    { label: "Soft Shadow", prompt: "white studio background with subtle soft shadow underneath, product photography, floating effect, professional e-commerce", negativePrompt: "harsh shadows, dark areas, cluttered background" },
    { label: "Gradient White", prompt: "smooth white to light gray gradient background, professional product photography, soft lighting, e-commerce ready", negativePrompt: "harsh transitions, patterns, textures, distractions" },
    { label: "Lifestyle Table", prompt: "clean white marble table surface with soft background blur, lifestyle product photography, minimalist e-commerce", negativePrompt: "cluttered, busy background, harsh shadows, distracting elements" },
    { label: "Tech Dark", prompt: "sleek dark gradient background, premium tech product photography, subtle blue accent lighting, professional e-commerce", negativePrompt: "bright colors, cluttered, busy patterns, distracting elements" },
  ],
  studio: [
    { label: "Classic White", prompt: "professional white studio background, clean, minimal, soft even lighting", negativePrompt: "shadows, gradients, textures, patterns" },
    { label: "Neutral Gray", prompt: "professional medium gray studio background, even lighting, photography backdrop", negativePrompt: "color cast, patterns, textures, harsh shadows" },
    { label: "Black Elegant", prompt: "pure black studio background, dramatic professional lighting, elegant minimal", negativePrompt: "gray areas, reflections, gradients, textures" },
    { label: "Seamless Paper", prompt: "seamless paper studio backdrop, professional photography, soft lighting, clean", negativePrompt: "creases, wrinkles, seams, shadows" },
    { label: "Cyclorama", prompt: "white cyclorama studio background, infinite white, no horizon line, professional lighting", negativePrompt: "seams, corners, shadows, floor lines" },
    { label: "Split Light", prompt: "studio background with dramatic split lighting, half shadow half light, professional portrait", negativePrompt: "colored lights, patterns, busy background" },
  ],
  lifestyle: [
    { label: "Modern Living", prompt: "modern minimalist living room background, soft natural lighting, neutral tones, blurred interior", negativePrompt: "cluttered, outdated furniture, harsh lighting" },
    { label: "Cozy Home", prompt: "warm cozy home interior background, soft bokeh, natural light through window, lifestyle photography", negativePrompt: "cold tones, harsh shadows, cluttered mess" },
    { label: "Office Desk", prompt: "clean modern office desk background, professional workspace, soft lighting, productive environment", negativePrompt: "messy desk, outdated equipment, cluttered" },
    { label: "Kitchen Scene", prompt: "bright modern kitchen background, clean countertop, natural lighting, lifestyle photography", negativePrompt: "dirty dishes, cluttered counters, old appliances" },
    { label: "Bedroom Cozy", prompt: "soft bedroom background, natural morning light, cozy bedding, peaceful atmosphere", negativePrompt: "messy bed, dark lighting, cluttered room" },
    { label: "Cafe Vibes", prompt: "trendy cafe interior background, warm ambient lighting, bokeh effect, lifestyle photography", negativePrompt: "crowded, dirty tables, harsh lighting" },
  ],
  nature: [
    { label: "Forest Bokeh", prompt: "beautiful forest background with soft bokeh, natural green tones, dappled sunlight, outdoor photography", negativePrompt: "harsh light, dead trees, dark shadows" },
    { label: "Beach Sunset", prompt: "golden hour beach background, soft waves, warm sunset colors, peaceful ocean view", negativePrompt: "harsh midday sun, crowded beach, dark storm" },
    { label: "Mountain Vista", prompt: "majestic mountain landscape background, soft morning mist, natural beauty, outdoor adventure", negativePrompt: "harsh weather, dark clouds, cluttered foreground" },
    { label: "Garden Flowers", prompt: "beautiful garden background with colorful flowers, soft focus bokeh, natural sunlight, spring atmosphere", negativePrompt: "dead plants, weeds, harsh shadows" },
    { label: "Autumn Leaves", prompt: "warm autumn forest background, golden and red leaves, soft natural lighting, fall atmosphere", negativePrompt: "bare trees, cold tones, dark shadows" },
    { label: "Tropical Paradise", prompt: "tropical beach background, palm trees, turquoise water, paradise vacation vibes", negativePrompt: "crowded, trash, dark clouds, harsh sun" },
  ],
  seasonal: [
    { label: "Winter Snow", prompt: "magical winter background with soft falling snow, cold blue tones, peaceful snowy landscape", negativePrompt: "harsh blizzard, dark storm, dirty snow" },
    { label: "Christmas Festive", prompt: "festive Christmas background with bokeh lights, warm red and gold tones, holiday atmosphere", negativePrompt: "cluttered decorations, harsh lighting, tacky elements" },
    { label: "Spring Bloom", prompt: "fresh spring background with cherry blossoms, soft pink petals, gentle sunlight, renewal atmosphere", negativePrompt: "dead flowers, harsh light, winter elements" },
    { label: "Summer Vibes", prompt: "bright summer background, warm golden light, beach vacation vibes, relaxed atmosphere", negativePrompt: "cold tones, dark shadows, winter elements" },
    { label: "Halloween Spooky", prompt: "atmospheric Halloween background, orange and purple tones, mysterious fog, spooky but elegant", negativePrompt: "gore, scary monsters, too dark, cheap decorations" },
    { label: "Valentine Romance", prompt: "romantic Valentine's Day background, soft pink and red tones, hearts bokeh, love atmosphere", negativePrompt: "harsh colors, tacky decorations, cluttered" },
  ],
  food: [
    { label: "Marble Surface", prompt: "elegant white marble surface background, food photography, soft overhead lighting, clean minimal", negativePrompt: "stains, cracks, busy patterns, cluttered" },
    { label: "Rustic Wood", prompt: "warm rustic wooden table background, natural texture, food photography, cozy atmosphere", negativePrompt: "scratches, dirty surface, harsh lighting" },
    { label: "Dark Moody", prompt: "dark moody food photography background, dramatic lighting, elegant shadows, restaurant quality", negativePrompt: "too bright, flat lighting, cluttered elements" },
    { label: "Fresh Kitchen", prompt: "bright clean kitchen background, fresh ingredients scattered, natural lighting, culinary photography", negativePrompt: "dirty kitchen, cluttered mess, harsh shadows" },
    { label: "Cafe Table", prompt: "trendy cafe table setting background, morning coffee vibes, soft natural light, lifestyle food photography", negativePrompt: "dirty dishes, cluttered table, harsh lighting" },
    { label: "Outdoor Picnic", prompt: "beautiful outdoor picnic setting background, natural grass, soft sunlight, fresh and inviting", negativePrompt: "bugs, dirty blanket, harsh midday sun" },
  ],
  luxury: [
    { label: "Black Velvet", prompt: "luxurious black velvet background, elegant texture, premium product photography, sophisticated lighting", negativePrompt: "cheap fabric, wrinkles, dust, harsh lighting" },
    { label: "Gold Accent", prompt: "elegant dark background with subtle gold accents, luxury brand aesthetic, premium lighting", negativePrompt: "gaudy gold, cheap looking, too bright, cluttered" },
    { label: "Marble Luxury", prompt: "premium white marble background with subtle gold veins, luxury product photography, elegant lighting", negativePrompt: "cheap marble, stains, busy patterns" },
    { label: "Crystal Bokeh", prompt: "luxury background with crystal bokeh lights, elegant sparkle effect, premium brand aesthetic", negativePrompt: "gaudy, too busy, cheap glitter, harsh lights" },
    { label: "Silk Waves", prompt: "flowing silk fabric background, elegant waves, luxury texture, soft sophisticated lighting", negativePrompt: "wrinkles, cheap fabric, harsh shadows" },
    { label: "Rose Gold", prompt: "elegant rose gold metallic background, premium feminine aesthetic, soft luxury lighting", negativePrompt: "gaudy, cheap metallic, harsh reflections" },
  ],
  creative: [
    { label: "Neon Glow", prompt: "vibrant neon glow background, cyberpunk aesthetic, pink and blue neon lights, futuristic", negativePrompt: "harsh pure colors, cluttered, too busy, pixelated" },
    { label: "Abstract Waves", prompt: "artistic abstract wave background, flowing colors, gradient blend, creative photography", negativePrompt: "harsh transitions, pixelated, low quality, busy" },
    { label: "Holographic", prompt: "iridescent holographic background, rainbow reflections, modern creative aesthetic, ethereal glow", negativePrompt: "gaudy colors, pixelated, cheap looking" },
    { label: "Geometric", prompt: "modern geometric pattern background, clean lines, minimalist design, contemporary art", negativePrompt: "busy patterns, cluttered, harsh colors" },
    { label: "Smoke Art", prompt: "artistic colorful smoke background, flowing wisps, dramatic lighting, creative photography", negativePrompt: "messy, chaotic, low quality, pixelated" },
    { label: "Galaxy Space", prompt: "cosmic galaxy background, stars and nebula, deep space aesthetic, ethereal and majestic", negativePrompt: "cartoonish, low quality, too bright, harsh" },
  ],
};

export default function BackgroundGenerator() {
  const { data: session } = useSession();
  const t = useTranslations('components.loginPrompt.backgroundGenerator');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: number} | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  const [prompt, setPrompt] = useState("pure white seamless studio background, e-commerce product photography, professional lighting, clean minimal");
  const [negativePrompt, setNegativePrompt] = useState("shadows, gradient, texture, patterns, objects, distractions");
  const [refinePrompt, setRefinePrompt] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ecommerce');
  const [selectedPreset, setSelectedPreset] = useState<string | null>("Pure White");

  const handlePresetSelect = (preset: { label: string; prompt: string; negativePrompt: string }) => {
    setPrompt(preset.prompt);
    setNegativePrompt(preset.negativePrompt);
    setSelectedPreset(preset.label);
  };

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

    } catch (error: unknown) {
      console.error("Background generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to generate background: ${errorMessage}`);
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
      <LoginPrompt
        title={t('title')}
        description={t('description')}
        callbackUrl="/tools/background-generator"
        accentColor="pink"
        features={["3 Free Credits", "No Credit Card", "AI-Generated"]}
      />
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
              <p className="mb-2">Maximum file size: 20MB</p>
              <CreditCostBadge tool="background_generate" size="md" />
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

          {/* Background Settings with Categories */}
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FaMagic className="text-pink-400" />
              Background Settings
            </h3>

            {/* Category Tabs */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400">
                Choose a category
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_CATEGORIES.map((category) => {
                  const IconComponent = category.icon;
                  const isActive = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        setSelectedPreset(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg`
                          : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preset Buttons for Selected Category */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400">
                Select a preset from {PRESET_CATEGORIES.find(c => c.id === activeCategory)?.label}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESETS_BY_CATEGORY[activeCategory]?.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetSelect(preset)}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${
                      selectedPreset === preset.label
                        ? 'bg-pink-500 text-white ring-2 ring-pink-400 ring-offset-2 ring-offset-gray-800'
                        : 'bg-gray-700/70 hover:bg-gray-600 text-gray-200 border border-gray-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Describe the background you want
              </label>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setSelectedPreset(null);
                }}
                disabled={processing}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                      <p className="text-gray-500">Click &quot;Generate Background&quot; to process</p>
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
