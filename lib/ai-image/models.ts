/**
 * AI Image Generator - Model Definitions
 * Defines available models, their costs, and configurations
 */

export type AIImageMode = 'text-to-image' | 'image-to-image';

export interface AIModel {
  id: string;
  name: string;
  replicateId: string;
  description: string;
  credits: number;
  costUSD: number;
  modes: AIImageMode[];
  features: string[];
  maxReferenceImages?: number;
  resolutions?: string[];
}

export interface AspectRatio {
  id: string;
  name: string;
  ratio: string;
  width: number;
  height: number;
  description: string;
}

// Available AI Models
export const AI_MODELS: AIModel[] = [
  {
    id: 'flux-schnell',
    name: 'Flux Schnell',
    replicateId: 'black-forest-labs/flux-schnell',
    description: 'Fastest generation, great for prototypes',
    credits: 1,
    costUSD: 0.003,
    modes: ['text-to-image'],
    features: ['Fast', 'Low cost'],
  },
  {
    id: 'flux-1.1-pro',
    name: 'Flux 1.1 Pro',
    replicateId: 'black-forest-labs/flux-1.1-pro',
    description: 'Excellent quality, fast generation',
    credits: 2,
    costUSD: 0.04,
    modes: ['text-to-image'],
    features: ['High quality', 'Fast', 'Recommended'],
  },
  {
    id: 'flux-1.1-pro-ultra',
    name: 'Flux 1.1 Pro Ultra',
    replicateId: 'black-forest-labs/flux-1.1-pro-ultra',
    description: '4MP resolution, raw mode for photorealism',
    credits: 3,
    costUSD: 0.06,
    modes: ['text-to-image'],
    features: ['4MP', 'Photorealistic', 'Raw mode'],
  },
  {
    id: 'flux-2.0-pro',
    name: 'Flux 2.0 Pro',
    replicateId: 'black-forest-labs/flux-2-pro',
    description: 'Highest quality, up to 8 reference images',
    credits: 4,
    costUSD: 0.05,
    modes: ['text-to-image'],
    features: ['Best quality', '8 reference images'],
    maxReferenceImages: 8,
  },
  {
    id: 'flux-kontext-pro',
    name: 'Flux Kontext Pro',
    replicateId: 'black-forest-labs/flux-kontext-pro',
    description: 'Edit images with text prompts',
    credits: 2,
    costUSD: 0.04,
    modes: ['image-to-image'],
    features: ['Image editing', 'Text-guided'],
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    replicateId: 'google/nano-banana-pro',
    description: 'Google Gemini 3 - best text rendering, up to 14 reference images',
    credits: 5,
    costUSD: 0.15,
    modes: ['text-to-image', 'image-to-image'],
    features: ['Best text rendering', '14 reference images', 'Up to 4K', 'Premium'],
    maxReferenceImages: 14,
    resolutions: ['1K', '2K', '4K'],
  },
];

// Aspect Ratios
export const ASPECT_RATIOS: AspectRatio[] = [
  {
    id: '1:1',
    name: 'Square',
    ratio: '1:1',
    width: 1024,
    height: 1024,
    description: 'Social media, profile pictures',
  },
  {
    id: '16:9',
    name: 'Landscape',
    ratio: '16:9',
    width: 1344,
    height: 768,
    description: 'Videos, presentations, desktop',
  },
  {
    id: '9:16',
    name: 'Portrait',
    ratio: '9:16',
    width: 768,
    height: 1344,
    description: 'Stories, mobile, TikTok',
  },
  {
    id: '4:3',
    name: 'Standard',
    ratio: '4:3',
    width: 1152,
    height: 896,
    description: 'Traditional photos',
  },
  {
    id: '3:2',
    name: 'Photo',
    ratio: '3:2',
    width: 1216,
    height: 832,
    description: 'Photography standard',
  },
  {
    id: '21:9',
    name: 'Ultrawide',
    ratio: '21:9',
    width: 1536,
    height: 640,
    description: 'Cinematic, ultrawide displays',
  },
];

// Image count options
export const IMAGE_COUNT_OPTIONS = [1, 2, 3, 4] as const;
export type ImageCount = typeof IMAGE_COUNT_OPTIONS[number];

// Helper functions
export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === id);
}

export function getModelsForMode(mode: AIImageMode): AIModel[] {
  return AI_MODELS.filter(m => m.modes.includes(mode));
}

export function getAspectRatioById(id: string): AspectRatio | undefined {
  return ASPECT_RATIOS.find(ar => ar.id === id);
}

export function calculateCredits(modelId: string, imageCount: number): number {
  const model = getModelById(modelId);
  if (!model) return 0;
  return model.credits * imageCount;
}

export function calculateCostUSD(modelId: string, imageCount: number): number {
  const model = getModelById(modelId);
  if (!model) return 0;
  return model.costUSD * imageCount;
}

// Default values
export const DEFAULT_MODEL = 'flux-1.1-pro';
export const DEFAULT_ASPECT_RATIO = '1:1';
export const DEFAULT_IMAGE_COUNT: ImageCount = 1;
