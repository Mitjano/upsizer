'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ConversionStats {
  originalSize: number;
  convertedSize: number;
  sizeDifference: number;
  originalFormat: string;
  targetFormat: string;
  quality: number;
  width: number;
  height: number;
}

const SUPPORTED_FORMATS = [
  { value: 'jpg', label: 'JPG', description: 'Best for photos', hasQuality: true },
  { value: 'png', label: 'PNG', description: 'Lossless, transparency', hasQuality: true },
  { value: 'webp', label: 'WebP', description: 'Modern, small size', hasQuality: true },
  { value: 'avif', label: 'AVIF', description: 'Next-gen, smallest', hasQuality: true },
  { value: 'gif', label: 'GIF', description: 'Animation support', hasQuality: false },
];

export default function FormatConverter() {
  const { data: session } = useSession();
  const t = useTranslations('formatConverter');
  const { trackImageUploaded, trackImageDownloaded } = useAnalytics();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [originalFileName, setOriginalFileName] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<string>('');

  // Conversion settings
  const [targetFormat, setTargetFormat] = useState('webp');
  const [quality, setQuality] = useState(80);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Reset state
    setError(null);
    setConvertedImage(null);
    setStats(null);

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError(t('errors.invalidType'));
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setError(t('errors.tooLarge'));
      return;
    }

    // Track upload
    trackImageUploaded(file.size, file.type);

    // Save original filename and detected format
    setOriginalFileName(file.name);
    const format = file.type.split('/')[1].replace('jpeg', 'jpg');
    setDetectedFormat(format);

    // Show original image
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setOriginalImage(result);
    };
    reader.onerror = () => {
      setError(t('errors.readFailed'));
    };
    reader.readAsDataURL(file);
  };

  const handleConvert = async () => {
    if (!originalImage) return;

    setLoading(true);
    setError(null);
    setProgress(t('progress.converting'));

    try {
      // Convert data URL to blob properly
      const base64Data = originalImage.split(',')[1];
      const mimeType = originalImage.split(',')[0].split(':')[1].split(';')[0];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const formData = new FormData();
      formData.append('file', blob, originalFileName || 'image.jpg');
      formData.append('format', targetFormat);
      formData.append('quality', quality.toString());

      setProgress(t('progress.processing'));

      const res = await fetch('/api/convert-format', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('errors.conversionFailed'));
      }

      setConvertedImage(data.image);
      setStats(data.stats);
      setProgress('');

    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.conversionFailed'));
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!convertedImage) return;

    const baseName = originalFileName.split('.').slice(0, -1).join('.') || 'converted';
    const link = document.createElement('a');
    link.href = convertedImage;
    link.download = `${baseName}.${stats?.targetFormat || targetFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Track download
    trackImageDownloaded('convert');
  };

  const reset = () => {
    setOriginalImage(null);
    setConvertedImage(null);
    setStats(null);
    setError(null);
    setProgress('');
    setOriginalFileName('');
    setDetectedFormat('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const selectedFormat = SUPPORTED_FORMATS.find(f => f.value === targetFormat);

  // Show login prompt for unauthenticated users
  if (!session) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 bg-gray-100 dark:bg-gray-800/30">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-500 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{t('auth.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t('auth.description')}
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/auth/signin"
                className="inline-block px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition text-white"
              >
                {t('auth.signIn')}
              </a>
              <a
                href="/auth/signup"
                className="inline-block px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                {t('auth.signUp')}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {!originalImage ? (
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 text-center hover:border-emerald-500 transition-colors bg-gray-100 dark:bg-gray-800/30">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/avif,image/gif"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('upload.title')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('upload.formats')}</p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('upload.free')}
          </span>
        </div>
      ) : (
        <div>
          {/* Settings Panel */}
          <div className="mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('settings.title')}</h3>

            {/* Detected Format Info */}
            <div className="mb-4 p-3 bg-gray-200 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('settings.detected')}: <span className="font-semibold text-gray-900 dark:text-white uppercase">{detectedFormat}</span>
                <span className="mx-2">|</span>
                {originalFileName}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Target Format Selector */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  {t('settings.targetFormat')}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {SUPPORTED_FORMATS.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setTargetFormat(format.value)}
                      disabled={loading || format.value === detectedFormat}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        targetFormat === format.value
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : format.value === detectedFormat
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                          : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                      }`}
                    >
                      <span className="font-bold text-gray-900 dark:text-white">{format.label}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{format.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Slider */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  {t('settings.quality')}: {quality}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  disabled={loading || !selectedFormat?.hasQuality}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>{t('settings.smallerFile')}</span>
                  <span>{t('settings.betterQuality')}</span>
                </div>
                {!selectedFormat?.hasQuality && (
                  <p className="text-xs text-amber-500 mt-2">{t('settings.noQuality')}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleConvert}
                disabled={loading || targetFormat === detectedFormat}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition text-white"
              >
                {loading ? t('buttons.converting') : t('buttons.convert')}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                {t('buttons.newImage')}
              </button>
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg">
              <p className="text-emerald-600 dark:text-emerald-400">{progress}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-500 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('preview.original')}</h3>
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm font-medium uppercase text-gray-700 dark:text-gray-300">
                  {detectedFormat}
                </span>
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Converted */}
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('preview.converted')}</h3>
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-sm font-medium uppercase">
                  {targetFormat}
                </span>
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                {convertedImage ? (
                  <img
                    src={convertedImage}
                    alt="Converted"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-500">
                    {loading ? t('preview.processing') : t('preview.clickConvert')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('results.title')}</h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('results.originalSize')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatFileSize(stats.originalSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('results.convertedSize')}</p>
                  <p className="text-xl font-bold text-emerald-500">{formatFileSize(stats.convertedSize)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('results.sizeDifference')}</p>
                  <p className={`text-xl font-bold ${stats.sizeDifference < 0 ? 'text-emerald-500' : stats.sizeDifference > 0 ? 'text-amber-500' : 'text-gray-500'}`}>
                    {stats.sizeDifference > 0 ? '+' : ''}{stats.sizeDifference}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('results.conversion')}</p>
                  <p className="text-xl font-bold uppercase text-gray-900 dark:text-white">
                    {stats.originalFormat} → {stats.targetFormat}
                  </p>
                </div>
              </div>

              <button
                onClick={downloadImage}
                className="mt-6 w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition text-white"
              >
                {t('buttons.download')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
