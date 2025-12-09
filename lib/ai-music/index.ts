/**
 * AI Music Module - Main Export
 *
 * Centralne eksporty dla modułu AI Music
 */

// Models & Configuration
export {
  type MusicProvider,
  type MusicModelId,
  type MusicStyle,
  type MusicMood,
  type MusicDuration,
  type MasteringIntensity,
  type MusicModelConfig,
  type MasteringConfig,
  MUSIC_MODELS,
  MASTERING_OPTIONS,
  getModelConfig,
  getActiveModels,
  calculateMusicCost,
  getMasteringCost,
  DEFAULT_MUSIC_SETTINGS,
} from './models';

// Generation
export {
  type MusicProviderType,
  type MusicGenerationInput,
  type MusicGenerationResult,
  generateMusic,
  checkMusicGenerationStatus,
  cancelMusicGeneration,
} from './generate';

// Suno Provider (direct access if needed)
export {
  type SunoGenerationInput,
  type SunoGenerationResult,
  type SunoStatusResult,
  type SunoClip,
  generateMusicSuno,
  checkSunoStatus,
  cancelSunoGeneration,
} from './suno-provider';

// PiAPI Provider (Udio via PiAPI)
export {
  type PiAPIGenerationInput,
  type PiAPIGenerationResult,
  type PiAPIStatusResult,
  type PiAPISong,
  generateMusicPiAPI,
  checkPiAPIStatus,
  cancelPiAPIGeneration,
} from './piapi-provider';

// Mastering
export {
  type MasteringInput,
  type MasteringResult,
  masterAudio,
  checkMasteringStatus,
  calculateMasteringCost,
} from './mastering';

// Storage
export {
  downloadAndSaveMusic,
  downloadAndSaveMasteredMusic,
  saveWaveformImage,
  deleteMusic as deleteMusicFile,
  getFileSize,
  fileExists,
  generateMusicPath,
  cleanupOldMusic,
  getTotalStorageSize,
  formatFileSize,
} from './storage';

// Database
export {
  type MusicGenerationStatus,
  type MasteringStatus,
  type CreateMusicParams,
  type UpdateMusicParams,
  type CreateFolderParams,
  type UpdateFolderParams,
  createMusicRecord,
  updateMusicRecord,
  getMusicById,
  getMusicByJobId,
  getUserMusic,
  countUserMusic,
  getPublicMusic,
  deleteMusic as deleteMusicRecord,
  setMusicPublic,
  likeMusic,
  incrementPlays,
  incrementViews,
  moveToFolder,
  getProcessingMusic,
  getMasteringPendingMusic,
  getUserMusicStats,
  // Folder operations
  createFolder,
  updateFolder,
  getFolderById,
  getUserFolders,
  deleteFolder,
  updateFolderStats,
} from './db';

// Conversion
export {
  type ConversionOptions,
  type ConversionResult,
  convertAudio,
  convertToWav,
  convertToFlac,
  checkFfmpeg,
  getFormatCreditCost,
  deleteConvertedFile,
} from './convert';

// Extend
export {
  type SunoExtendInput,
  type SunoExtendResult,
  extendMusicSuno,
} from './suno-provider';
