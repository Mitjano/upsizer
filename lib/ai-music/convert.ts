/**
 * Audio Format Conversion
 *
 * Uses ffmpeg to convert audio files to WAV/FLAC formats
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export interface ConversionOptions {
  sampleRate?: number;  // Default: 44100
  bitDepth?: number;    // Default: 16 for WAV, 24 for FLAC
  channels?: number;    // Default: 2 (stereo)
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  fileSize?: number;
  format: string;
  error?: string;
}

/**
 * Check if ffmpeg is available
 */
export async function checkFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Convert audio file to WAV format
 */
export async function convertToWav(
  inputPath: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const { sampleRate = 44100, bitDepth = 16, channels = 2 } = options;

  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(outputDir, `${baseName}.wav`);

  try {
    await runFfmpeg([
      '-i', inputPath,
      '-acodec', 'pcm_s' + bitDepth + 'le',
      '-ar', sampleRate.toString(),
      '-ac', channels.toString(),
      '-y',
      outputPath,
    ]);

    const stats = await fs.stat(outputPath);

    return {
      success: true,
      outputPath,
      fileSize: stats.size,
      format: 'wav',
    };
  } catch (error) {
    return {
      success: false,
      format: 'wav',
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}

/**
 * Convert audio file to FLAC format
 */
export async function convertToFlac(
  inputPath: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const { sampleRate = 44100, bitDepth = 24, channels = 2 } = options;

  const outputDir = path.dirname(inputPath);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(outputDir, `${baseName}.flac`);

  try {
    await runFfmpeg([
      '-i', inputPath,
      '-acodec', 'flac',
      '-ar', sampleRate.toString(),
      '-ac', channels.toString(),
      '-sample_fmt', bitDepth === 24 ? 's32' : 's16',
      '-compression_level', '8',
      '-y',
      outputPath,
    ]);

    const stats = await fs.stat(outputPath);

    return {
      success: true,
      outputPath,
      fileSize: stats.size,
      format: 'flac',
    };
  } catch (error) {
    return {
      success: false,
      format: 'flac',
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}

/**
 * Convert audio to specified format
 */
export async function convertAudio(
  inputPath: string,
  outputFormat: 'wav' | 'flac',
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  // Check if ffmpeg is available
  const hasFfmpeg = await checkFfmpeg();
  if (!hasFfmpeg) {
    return {
      success: false,
      format: outputFormat,
      error: 'ffmpeg is not installed or not available in PATH',
    };
  }

  // Check if input file exists
  try {
    await fs.access(inputPath);
  } catch {
    return {
      success: false,
      format: outputFormat,
      error: 'Input file not found',
    };
  }

  if (outputFormat === 'wav') {
    return convertToWav(inputPath, options);
  } else {
    return convertToFlac(inputPath, options);
  }
}

/**
 * Run ffmpeg command
 */
function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start ffmpeg: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });
  });
}

/**
 * Get format credit cost
 */
export function getFormatCreditCost(format: 'wav' | 'flac'): number {
  return format === 'wav' ? 2 : 3;
}

/**
 * Delete converted file (cleanup)
 */
export async function deleteConvertedFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore errors
  }
}
