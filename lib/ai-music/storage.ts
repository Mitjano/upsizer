/**
 * AI Music Storage Module
 *
 * Obsługuje pobieranie i przechowywanie plików audio
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const MUSIC_DIR = 'public/generated-music';
const WAVEFORM_DIR = 'public/generated-music/waveforms';

/**
 * Ensure directories exist
 */
function ensureDirectoryExists(dirPath: string): void {
  const fullPath = path.join(process.cwd(), dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

/**
 * Generate a path for a new audio file
 */
export function generateMusicPath(userId: string, format: string = 'mp3'): {
  localPath: string;
  publicUrl: string;
  filename: string;
} {
  ensureDirectoryExists(MUSIC_DIR);

  const filename = `${userId}-${uuidv4()}.${format}`;
  const localPath = path.join(MUSIC_DIR, filename);
  const publicUrl = `/generated-music/${filename}`;

  return { localPath, publicUrl, filename };
}

/**
 * Download and save audio file locally
 */
export async function downloadAndSaveMusic(
  audioUrl: string,
  userId: string,
  format: string = 'mp3'
): Promise<{
  success: boolean;
  localPath?: string;
  publicUrl?: string;
  fileSize?: number;
  error?: string;
}> {
  try {
    const { localPath, publicUrl } = generateMusicPath(userId, format);
    const fullPath = path.join(process.cwd(), localPath);

    // Download the audio file
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to disk
    fs.writeFileSync(fullPath, buffer);

    const stats = fs.statSync(fullPath);

    return {
      success: true,
      localPath,
      publicUrl,
      fileSize: stats.size,
    };
  } catch (error) {
    console.error('Download music error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download and save mastered audio file
 */
export async function downloadAndSaveMasteredMusic(
  audioUrl: string,
  userId: string,
  originalId: string,
  format: string = 'mp3'
): Promise<{
  success: boolean;
  localPath?: string;
  publicUrl?: string;
  fileSize?: number;
  error?: string;
}> {
  try {
    ensureDirectoryExists(MUSIC_DIR);

    const filename = `${userId}-${originalId}-mastered.${format}`;
    const localPath = path.join(MUSIC_DIR, filename);
    const publicUrl = `/generated-music/${filename}`;
    const fullPath = path.join(process.cwd(), localPath);

    // Download the audio file
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to download mastered audio: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to disk
    fs.writeFileSync(fullPath, buffer);

    const stats = fs.statSync(fullPath);

    return {
      success: true,
      localPath,
      publicUrl,
      fileSize: stats.size,
    };
  } catch (error) {
    console.error('Download mastered music error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save waveform image
 */
export async function saveWaveformImage(
  imageUrl: string,
  userId: string,
  musicId: string
): Promise<{
  success: boolean;
  localPath?: string;
  publicUrl?: string;
  error?: string;
}> {
  try {
    ensureDirectoryExists(WAVEFORM_DIR);

    const filename = `${userId}-${musicId}-waveform.png`;
    const localPath = path.join(WAVEFORM_DIR, filename);
    const publicUrl = `/generated-music/waveforms/${filename}`;
    const fullPath = path.join(process.cwd(), localPath);

    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download waveform: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to disk
    fs.writeFileSync(fullPath, buffer);

    return {
      success: true,
      localPath,
      publicUrl,
    };
  } catch (error) {
    console.error('Save waveform error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete music file
 */
export function deleteMusic(localPath: string): boolean {
  try {
    const fullPath = path.join(process.cwd(), localPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Delete music error:', error);
    return false;
  }
}

/**
 * Get file size
 */
export function getFileSize(localPath: string): number | null {
  try {
    const fullPath = path.join(process.cwd(), localPath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      return stats.size;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if file exists
 */
export function fileExists(localPath: string): boolean {
  const fullPath = path.join(process.cwd(), localPath);
  return fs.existsSync(fullPath);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get total storage size for music files
 */
export function getTotalStorageSize(): number {
  try {
    const musicPath = path.join(process.cwd(), MUSIC_DIR);
    if (!fs.existsSync(musicPath)) return 0;

    let totalSize = 0;
    const files = fs.readdirSync(musicPath);

    for (const file of files) {
      const filePath = path.join(musicPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      }
    }

    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Cleanup old music files (older than specified days)
 */
export async function cleanupOldMusic(daysOld: number = 30): Promise<number> {
  try {
    const musicPath = path.join(process.cwd(), MUSIC_DIR);
    if (!fs.existsSync(musicPath)) return 0;

    const now = Date.now();
    const maxAge = daysOld * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    const files = fs.readdirSync(musicPath);

    for (const file of files) {
      const filePath = path.join(musicPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile() && now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Cleanup old music error:', error);
    return 0;
  }
}
