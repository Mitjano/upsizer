/**
 * AI Music Models Configuration
 *
 * Konfiguracja dostępnych modeli do generowania muzyki
 */

export type MusicProvider = 'fal';

export type MusicModelId = 'minimax-music-2.0';

export type MusicStyle =
  | 'pop'
  | 'rock'
  | 'hiphop'
  | 'rnb'
  | 'jazz'
  | 'electronic'
  | 'classical'
  | 'country'
  | 'folk'
  | 'metal'
  | 'reggae'
  | 'blues'
  | 'latin'
  | 'indie';

export type MusicMood =
  | 'happy'
  | 'sad'
  | 'energetic'
  | 'calm'
  | 'romantic'
  | 'melancholic'
  | 'uplifting'
  | 'dark'
  | 'dreamy'
  | 'aggressive'
  | 'nostalgic'
  | 'epic';

export type MusicDuration = 60 | 120 | 180 | 240 | 300; // 1-5 minutes in seconds

export type MasteringIntensity = 'lo' | 'med' | 'hi';

export interface MusicModelConfig {
  id: MusicModelId;
  name: string;
  description: string;
  provider: MusicProvider;
  modelIdentifier: string;
  isActive: boolean;
  supportsLyrics: boolean;
  supportsInstrumental: boolean;
  maxDuration: MusicDuration;
  minDuration: MusicDuration;
  durations: MusicDuration[];
  styles: MusicStyle[];
  moods: MusicMood[];
  creditCost: {
    base: number; // base credits per generation
    perMinute: number; // additional credits per minute
  };
  estimatedProcessingTime: {
    min: number; // seconds
    max: number;
  };
  outputFormat: 'mp3' | 'wav';
  sampleRate: number;
  features: string[];
}

export const MUSIC_MODELS: Record<MusicModelId, MusicModelConfig> = {
  'minimax-music-2.0': {
    id: 'minimax-music-2.0',
    name: 'MiniMax Music 2.0',
    description: 'Professional music generation with realistic vocals. Up to 5 minutes with lyrics support.',
    provider: 'fal',
    modelIdentifier: 'fal-ai/minimax-music',
    isActive: true,
    supportsLyrics: true,
    supportsInstrumental: true,
    maxDuration: 300,
    minDuration: 60,
    durations: [60, 120, 180, 240, 300],
    styles: ['pop', 'rock', 'hiphop', 'rnb', 'jazz', 'electronic', 'classical', 'country', 'folk', 'metal', 'reggae', 'blues', 'latin', 'indie'],
    moods: ['happy', 'sad', 'energetic', 'calm', 'romantic', 'melancholic', 'uplifting', 'dark', 'dreamy', 'aggressive', 'nostalgic', 'epic'],
    creditCost: {
      base: 8,
      perMinute: 2,
    },
    estimatedProcessingTime: {
      min: 60,
      max: 300,
    },
    outputFormat: 'mp3',
    sampleRate: 44100,
    features: [
      'AI vocals with lyrics',
      'Multiple music styles',
      'Up to 5 minutes',
      'Professional quality audio',
      'Song structure tags support',
    ],
  },
};

export interface MasteringConfig {
  id: MasteringIntensity;
  name: string;
  description: string;
  creditCost: number;
}

export const MASTERING_OPTIONS: Record<MasteringIntensity, MasteringConfig> = {
  lo: {
    id: 'lo',
    name: 'Light',
    description: 'Subtle enhancement, preserves original dynamics',
    creditCost: 2,
  },
  med: {
    id: 'med',
    name: 'Medium',
    description: 'Balanced mastering for most genres',
    creditCost: 3,
  },
  hi: {
    id: 'hi',
    name: 'Heavy',
    description: 'Maximum loudness and punch, great for EDM/Rock',
    creditCost: 5,
  },
};

export function getModelConfig(modelId: MusicModelId): MusicModelConfig | undefined {
  return MUSIC_MODELS[modelId];
}

export function getActiveModels(): MusicModelConfig[] {
  return Object.values(MUSIC_MODELS).filter(m => m.isActive);
}

export function calculateMusicCost(modelId: MusicModelId, durationSeconds: MusicDuration): number {
  const model = getModelConfig(modelId);
  if (!model) return 0;

  const minutes = Math.ceil(durationSeconds / 60);
  return model.creditCost.base + (minutes - 1) * model.creditCost.perMinute;
}

export function getMasteringCost(intensity: MasteringIntensity): number {
  return MASTERING_OPTIONS[intensity]?.creditCost || 0;
}

export const DEFAULT_MUSIC_SETTINGS = {
  model: 'minimax-music-2.0' as MusicModelId,
  duration: 120 as MusicDuration,
  style: 'pop' as MusicStyle,
  mood: 'happy' as MusicMood,
  instrumental: false,
};
