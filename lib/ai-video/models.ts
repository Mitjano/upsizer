/**
 * AI Video Model Configurations
 *
 * Centralna konfiguracja modeli do generowania wideo AI.
 * Obsługuje wielu dostawców: Replicate, PiAPI, Runway
 */

export type VideoProvider = 'replicate' | 'piapi' | 'runway' | 'fal';

export type VideoModelId =
  | 'pixverse-v5'
  | 'kling-2.5'
  | 'veo-3.1'
  | 'runway-gen4'
  | 'hailuo-02'
  | 'hailuo-02-pro'
  | 'luma-ray2-flash';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
export type Resolution = '360p' | '540p' | '720p' | '1080p';
export type Duration = 4 | 5 | 6 | 8 | 10;

export interface VideoModelConfig {
  id: VideoModelId;
  name: string;
  description: string;
  provider: VideoProvider;
  /** Identyfikator modelu u dostawcy */
  modelIdentifier: string;
  /** Wersja modelu (dla Replicate) */
  modelVersion?: string;
  /** Obsługiwane czasy trwania w sekundach */
  durations: Duration[];
  /** Obsługiwane proporcje */
  aspectRatios: AspectRatio[];
  /** Obsługiwane rozdzielczości */
  resolutions: Resolution[];
  /** Czy obsługuje Image-to-Video */
  supportsImageToVideo: boolean;
  /** Czy generuje z dźwiękiem */
  supportsAudio: boolean;
  /** Szacowany czas przetwarzania w sekundach */
  estimatedProcessingTime: {
    min: number;
    max: number;
  };
  /** Koszt API w USD */
  costPerGeneration: {
    [key in Duration]?: number;
  };
  /** Tagi do filtrowania */
  tags: string[];
  /** Czy model jest aktywny */
  isActive: boolean;
  /** Czy to model premium */
  isPremium: boolean;
}

/**
 * Konfiguracja wszystkich dostępnych modeli wideo
 */
export const VIDEO_MODELS: Record<VideoModelId, VideoModelConfig> = {
  'pixverse-v5': {
    id: 'pixverse-v5',
    name: 'PixVerse V5',
    description: 'Szybki i wysokiej jakości model text-to-video. Idealny do krótkich klipów promocyjnych.',
    provider: 'replicate',
    modelIdentifier: 'pixverse/pixverse-v5',
    durations: [5, 8],
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p', '1080p'],
    supportsImageToVideo: true,
    supportsAudio: false,
    estimatedProcessingTime: {
      min: 60,
      max: 180,
    },
    costPerGeneration: {
      5: 0.30,
      8: 0.50,
    },
    tags: ['fast', 'quality', 'popular'],
    isActive: true,
    isPremium: false,
  },
  'kling-2.5': {
    id: 'kling-2.5',
    name: 'Kling 2.5',
    description: 'Ekonomiczny model od Kuaishou z wysoką jakością ruchu i szczegółów.',
    provider: 'piapi',
    modelIdentifier: 'kling-video/v2.5/text2video',
    durations: [5, 10],
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p', '1080p'],
    supportsImageToVideo: true,
    supportsAudio: false,
    estimatedProcessingTime: {
      min: 120,
      max: 300,
    },
    costPerGeneration: {
      5: 0.33,
      10: 0.66,
    },
    tags: ['budget', 'quality', 'motion'],
    isActive: true,
    isPremium: false,
  },
  'veo-3.1': {
    id: 'veo-3.1',
    name: 'Google Veo 3',
    description: 'Premium model od Google z natywną generacją dźwięku. Najwyższa jakość i realizm.',
    provider: 'replicate',
    modelIdentifier: 'google/veo-3.1',
    durations: [4, 6, 8],
    aspectRatios: ['16:9', '9:16', '1:1', '4:3'],
    resolutions: ['720p', '1080p'],
    supportsImageToVideo: false,
    supportsAudio: true,
    estimatedProcessingTime: {
      min: 180,
      max: 420,
    },
    costPerGeneration: {
      4: 1.30,
      6: 1.90,
      8: 2.50,
    },
    tags: ['premium', 'audio', 'cinematic', 'google'],
    isActive: true,
    isPremium: true,
  },
  'runway-gen4': {
    id: 'runway-gen4',
    name: 'Runway Gen-4',
    description: 'Najnowszy model od Runway z doskonałą kontrolą stylu i ruchu kamery.',
    provider: 'runway',
    modelIdentifier: 'gen4-turbo',
    durations: [5, 10],
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p', '1080p'],
    supportsImageToVideo: true,
    supportsAudio: false,
    estimatedProcessingTime: {
      min: 90,
      max: 240,
    },
    costPerGeneration: {
      5: 0.50,
      10: 1.00,
    },
    tags: ['cinematic', 'control', 'motion'],
    isActive: false, // Włącz gdy skonfigurowany
    isPremium: true,
  },
  'hailuo-02': {
    id: 'hailuo-02',
    name: 'MiniMax Hailuo 02',
    description: '#2 model wideo na świecie. Świetna jakość ruchu i realizm w przystępnej cenie.',
    provider: 'fal',
    modelIdentifier: 'fal-ai/minimax-video',
    durations: [6],
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p'],
    supportsImageToVideo: true,
    supportsAudio: false,
    estimatedProcessingTime: {
      min: 120,
      max: 300,
    },
    costPerGeneration: {
      6: 0.27,
    },
    tags: ['quality', 'budget', 'top-ranked'],
    isActive: true,
    isPremium: false,
  },
  'hailuo-02-pro': {
    id: 'hailuo-02-pro',
    name: 'MiniMax Hailuo 02 Pro',
    description: 'Wersja Pro z rozdzielczością 1080p. Najlepsza jakość od MiniMax.',
    provider: 'fal',
    modelIdentifier: 'fal-ai/minimax-video/video-01-live',
    durations: [6],
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['1080p'],
    supportsImageToVideo: true,
    supportsAudio: false,
    estimatedProcessingTime: {
      min: 180,
      max: 360,
    },
    costPerGeneration: {
      6: 0.48,
    },
    tags: ['quality', 'pro', '1080p'],
    isActive: true,
    isPremium: false,
  },
  'luma-ray2-flash': {
    id: 'luma-ray2-flash',
    name: 'Luma Ray2 Flash',
    description: 'Szybki i tani model od Luma. Idealny do szybkich iteracji.',
    provider: 'fal',
    modelIdentifier: 'fal-ai/luma-dream-machine',
    durations: [5],
    aspectRatios: ['16:9', '9:16', '1:1'],
    resolutions: ['720p', '1080p'],
    supportsImageToVideo: true,
    supportsAudio: false,
    estimatedProcessingTime: {
      min: 60,
      max: 180,
    },
    costPerGeneration: {
      5: 0.20,
    },
    tags: ['fast', 'budget', 'iterations'],
    isActive: true,
    isPremium: false,
  },
};

/**
 * Pobierz aktywne modele
 */
export function getActiveModels(): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(model => model.isActive);
}

/**
 * Pobierz modele dla danego dostawcy
 */
export function getModelsByProvider(provider: VideoProvider): VideoModelConfig[] {
  return Object.values(VIDEO_MODELS).filter(
    model => model.provider === provider && model.isActive
  );
}

/**
 * Pobierz konfigurację modelu
 */
export function getModelConfig(modelId: VideoModelId): VideoModelConfig | undefined {
  return VIDEO_MODELS[modelId];
}

/**
 * Sprawdź czy model obsługuje daną rozdzielczość
 */
export function supportsResolution(modelId: VideoModelId, resolution: Resolution): boolean {
  const model = VIDEO_MODELS[modelId];
  return model?.resolutions.includes(resolution) ?? false;
}

/**
 * Sprawdź czy model obsługuje dany czas trwania
 */
export function supportsDuration(modelId: VideoModelId, duration: Duration): boolean {
  const model = VIDEO_MODELS[modelId];
  return model?.durations.includes(duration) ?? false;
}

/**
 * Oblicz szacowany koszt generacji
 */
export function estimateCost(modelId: VideoModelId, duration: Duration): number {
  const model = VIDEO_MODELS[modelId];
  return model?.costPerGeneration[duration] ?? 0;
}

/**
 * Mapowanie modelu na ToolType dla kredytów
 */
export function getToolTypeForModel(modelId: VideoModelId, duration: Duration): string {
  switch (modelId) {
    case 'pixverse-v5':
      return duration === 5 ? 'video_pixverse_5s' : 'video_pixverse_8s';
    case 'kling-2.5':
      return duration === 5 ? 'video_kling_5s' : 'video_kling_10s';
    case 'veo-3.1':
      if (duration === 4) return 'video_veo_4s';
      if (duration === 6) return 'video_veo_6s';
      return 'video_veo_8s';
    case 'hailuo-02':
      return 'video_hailuo_6s';
    case 'hailuo-02-pro':
      return 'video_hailuo_pro_6s';
    case 'luma-ray2-flash':
      return 'video_luma_ray2_5s';
    default:
      return 'video_pixverse_5s';
  }
}

/**
 * Domyślne ustawienia dla nowej generacji
 */
export const DEFAULT_VIDEO_SETTINGS = {
  model: 'pixverse-v5' as VideoModelId,
  duration: 5 as Duration,
  aspectRatio: '16:9' as AspectRatio,
  resolution: '720p' as Resolution,
  fps: 24,
};
