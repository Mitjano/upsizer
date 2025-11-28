/**
 * Shared types for uploader components
 */

export interface BatchImageItem {
  file: File;
  id: string;
  previewUrl: string;
  upscaledUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: string;
  error?: string;
  imageInfo?: ImageInfo;
}

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
}

export interface UploaderSettings {
  scale: number;
  qualityBoost: boolean;
}

export interface BatchProgress {
  current: number;
  total: number;
}
