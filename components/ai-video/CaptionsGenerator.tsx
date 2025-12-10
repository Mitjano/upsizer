'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Language {
  code: string;
  name: string;
}

interface OutputFormat {
  id: string;
  name: string;
  description: string;
}

interface CaptionsConfig {
  languages: Language[];
  outputFormats: OutputFormat[];
  limits: {
    maxFileSize: number;
    supportedFormats: string[];
  };
  pricing: {
    cost: number;
    description: string;
  };
}

interface Segment {
  start: number;
  end: number;
  text: string;
}

interface GeneratedCaptions {
  transcription: string;
  segments: Segment[];
  formattedOutput: string;
  outputFormat: string;
  language: string;
  metadata: {
    segmentCount: number;
    duration: number;
    creditsUsed: number;
    remainingCredits: number;
  };
}

export default function CaptionsGenerator() {
  const t = useTranslations('aiVideo.captions');
  const { data: session } = useSession();

  const [config, setConfig] = useState<CaptionsConfig | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [language, setLanguage] = useState('auto');
  const [outputFormat, setOutputFormat] = useState('srt');
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch available options
  useEffect(() => {
    fetch('/api/ai-video/captions')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Failed to load config:', err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size
      if (config && selectedFile.size > config.limits.maxFileSize) {
        setError(t('errors.fileTooLarge'));
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (inputMode === 'file' && !file) {
      setError(t('errors.fileRequired'));
      return;
    }
    if (inputMode === 'url' && !mediaUrl.trim()) {
      setError(t('errors.urlRequired'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedCaptions(null);

    try {
      const formData = new FormData();

      if (inputMode === 'file' && file) {
        formData.append('file', file);
      } else if (inputMode === 'url') {
        formData.append('mediaUrl', mediaUrl.trim());
      }

      formData.append('language', language);
      formData.append('outputFormat', outputFormat);

      const response = await fetch('/api/ai-video/captions', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate captions');
      }

      setGeneratedCaptions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedCaptions?.formattedOutput) {
      await navigator.clipboard.writeText(generatedCaptions.formattedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedCaptions?.formattedOutput) {
      const extensions: Record<string, string> = {
        srt: 'srt',
        vtt: 'vtt',
        json: 'json',
        txt: 'txt',
      };
      const ext = extensions[generatedCaptions.outputFormat] || 'txt';
      const blob = new Blob([generatedCaptions.formattedOutput], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `captions-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Generator Form */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span>📝</span>
          {t('title')}
        </h2>

        {/* Input Mode Toggle */}
        <div className="mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode('file')}
              className={`flex-1 py-3 rounded-xl font-medium transition ${
                inputMode === 'file'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📁 {t('uploadFile')}
            </button>
            <button
              onClick={() => setInputMode('url')}
              className={`flex-1 py-3 rounded-xl font-medium transition ${
                inputMode === 'url'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🔗 {t('pasteUrl')}
            </button>
          </div>
        </div>

        {/* File Upload */}
        {inputMode === 'file' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('fileLabel')} *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div>
                  <span className="text-4xl mb-2 block">🎵</span>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-gray-500 text-sm">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-4xl mb-2 block">📤</span>
                  <p className="text-gray-400">{t('dropOrClick')}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {t('supportedFormats')}: {config?.limits.supportedFormats.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* URL Input */}
        {inputMode === 'url' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('urlLabel')} *
            </label>
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/audio.mp3"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
            />
            <p className="text-xs text-yellow-500 mt-2">
              ⚠️ {t('urlWarning') || 'Direct audio/video file URLs only (mp3, wav, mp4, etc.). YouTube, Vimeo, and TikTok links are not supported - please upload the file instead.'}
            </p>
          </div>
        )}

        {/* Language Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('languageLabel')}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          >
            {config?.languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Output Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('outputFormatLabel')}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {config?.outputFormats.map((format) => (
              <button
                key={format.id}
                onClick={() => setOutputFormat(format.id)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition ${
                  outputFormat === format.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {format.name}
              </button>
            ))}
          </div>
          {config?.outputFormats.find(f => f.id === outputFormat) && (
            <p className="text-xs text-gray-500 mt-2">
              {config.outputFormats.find(f => f.id === outputFormat)?.description}
            </p>
          )}
        </div>

        {/* Cost Preview */}
        <div className="mb-6 p-4 bg-gray-900/50 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{t('cost')}:</span>
            <span className="text-xl font-bold text-cyan-400">
              {config?.pricing.cost || 3} {t('credits')}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Generate Button */}
        {session ? (
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (inputMode === 'file' ? !file : !mediaUrl.trim())}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <span>📝</span>
                {t('generateButton')}
              </>
            )}
          </button>
        ) : (
          <Link
            href="/auth/signin"
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2"
          >
            {t('signInToGenerate')}
          </Link>
        )}
      </div>

      {/* Generated Captions Result */}
      {generatedCaptions && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📄</span>
              {t('resultTitle')}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-white transition flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <span>✓</span>
                    {t('copied')}
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    {t('copy')}
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium text-white transition flex items-center gap-2"
              >
                <span>⬇️</span>
                {t('download')}
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded-full text-xs">
              {generatedCaptions.outputFormat.toUpperCase()}
            </span>
            <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs">
              {generatedCaptions.metadata.segmentCount} {t('segments')}
            </span>
            <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs">
              {formatDuration(generatedCaptions.metadata.duration)}
            </span>
            <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-xs">
              {generatedCaptions.language}
            </span>
          </div>

          {/* Output Content */}
          <div className="bg-gray-900 rounded-xl p-4 max-h-[400px] overflow-y-auto">
            <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {generatedCaptions.formattedOutput}
            </pre>
          </div>

          {/* Credits Info */}
          <div className="mt-4 text-sm text-gray-500 text-right">
            {t('creditsUsed')}: {generatedCaptions.metadata.creditsUsed} | {t('remaining')}: {generatedCaptions.metadata.remainingCredits}
          </div>
        </div>
      )}
    </div>
  );
}
