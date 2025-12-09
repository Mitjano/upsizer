'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface Track {
  id: string;
  title?: string;
  prompt: string;
  style?: string;
  duration: number;
  actualDuration?: number;
  audioUrl?: string;
  instrumental: boolean;
}

interface ExtendPanelProps {
  track: Track;
  onClose: () => void;
  onExtendStarted: (extensionId: string) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function ExtendPanel({ track, onClose, onExtendStarted }: ExtendPanelProps) {
  const t = useTranslations('aiMusic');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(track.actualDuration || track.duration);

  // Extend settings
  const [continueAt, setContinueAt] = useState(Math.min(60, Math.floor(audioDuration / 2)));
  const [continuationPrompt, setContinuationPrompt] = useState('');
  const [styleOverride, setStyleOverride] = useState(track.style || '');
  const [customTitle, setCustomTitle] = useState('');

  // State
  const [isExtending, setIsExtending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Min/max for continue point
  const minContinueAt = 30;
  const maxContinueAt = Math.max(minContinueAt, audioDuration - 10);

  // Setup audio
  useEffect(() => {
    if (track.audioUrl) {
      const streamUrl = `/api/ai-music/${track.id}/stream`;
      audioRef.current = new Audio(streamUrl);

      audioRef.current.addEventListener('loadedmetadata', () => {
        if (audioRef.current) {
          setAudioDuration(audioRef.current.duration);
        }
      });

      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [track.audioUrl, track.id]);

  // Toggle playback
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Seek to position
  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Jump to continue point
  const jumpToContinuePoint = useCallback(() => {
    seekTo(continueAt);
    if (!isPlaying) {
      togglePlay();
    }
  }, [continueAt, isPlaying, seekTo, togglePlay]);

  // Set continue point from current position
  const setFromCurrentPosition = useCallback(() => {
    const newTime = Math.max(minContinueAt, Math.min(currentTime, maxContinueAt));
    setContinueAt(Math.floor(newTime));
  }, [currentTime, maxContinueAt]);

  // Handle extend
  const handleExtend = async () => {
    setIsExtending(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-music/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track.id,
          continueAt: Math.floor(continueAt),
          prompt: continuationPrompt.trim() || undefined,
          style: styleOverride.trim() || undefined,
          title: customTitle.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extend track');
      }

      onExtendStarted(data.musicId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extension failed');
    } finally {
      setIsExtending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">
            {t('extend.title') || 'Extend Track'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Track Info */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{track.instrumental ? '🎹' : '🎵'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">
                  {track.title || track.prompt.slice(0, 40)}
                </h4>
                <p className="text-sm text-gray-400 truncate">{track.style}</p>
                <p className="text-xs text-gray-500">{formatTime(audioDuration)}</p>
              </div>
            </div>
          </div>

          {/* Waveform / Timeline */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              {t('extend.continuePoint') || 'Continue From'}
            </label>

            {/* Timeline Bar */}
            <div className="relative h-12 bg-gray-800 rounded-lg overflow-hidden">
              {/* Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-purple-600/30"
                style={{ width: `${(currentTime / audioDuration) * 100}%` }}
              />

              {/* Continue Point Marker */}
              <div
                className="absolute top-0 h-full w-1 bg-green-500 cursor-pointer"
                style={{ left: `${(continueAt / audioDuration) * 100}%` }}
              />

              {/* Clickable area */}
              <div
                className="absolute inset-0 cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = x / rect.width;
                  const time = Math.floor(percent * audioDuration);
                  seekTo(time);
                }}
              />

              {/* Time labels */}
              <div className="absolute bottom-1 left-2 text-xs text-gray-400">
                {formatTime(currentTime)}
              </div>
              <div className="absolute bottom-1 right-2 text-xs text-gray-400">
                {formatTime(audioDuration)}
              </div>
            </div>

            {/* Continue Point Slider */}
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={minContinueAt}
                max={maxContinueAt}
                value={continueAt}
                onChange={(e) => setContinueAt(parseInt(e.target.value, 10))}
                className="flex-1 accent-green-500"
              />
              <span className="text-green-500 font-mono text-sm w-16 text-right">
                {formatTime(continueAt)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={togglePlay}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Play
                  </>
                )}
              </button>
              <button
                onClick={jumpToContinuePoint}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition"
              >
                {t('extend.preview') || 'Preview from point'}
              </button>
              <button
                onClick={setFromCurrentPosition}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition"
              >
                {t('extend.setFromCurrent') || 'Set from current'}
              </button>
            </div>
          </div>

          {/* Continuation Options */}
          <div className="space-y-4">
            {/* Continuation Prompt */}
            {!track.instrumental && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('extend.continuationLyrics') || 'Continuation Lyrics'}
                  <span className="text-gray-500 font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  value={continuationPrompt}
                  onChange={(e) => setContinuationPrompt(e.target.value)}
                  placeholder="[Verse 3]&#10;Your lyrics here..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('extend.lyricsHint') || 'Leave empty to let AI continue the song naturally'}
                </p>
              </div>
            )}

            {/* Style Override */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('extend.styleOverride') || 'Style'}
                <span className="text-gray-500 font-normal ml-1">(optional override)</span>
              </label>
              <input
                type="text"
                value={styleOverride}
                onChange={(e) => setStyleOverride(e.target.value)}
                placeholder={track.style || 'pop, energetic, uplifting'}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Custom Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('extend.customTitle') || 'Extension Title'}
                <span className="text-gray-500 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={`${track.title || 'Track'} (Extended)`}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-400">ℹ️</span>
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">{t('extend.howItWorks') || 'How it works'}</p>
                <p className="text-blue-400/80">
                  {t('extend.howItWorksDesc') || 'The AI will continue your song from the selected point, creating a seamless extension. This costs 10 credits.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {t('extend.cost') || 'Cost'}: <span className="text-white font-medium">10 credits</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
            >
              {t('extend.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleExtend}
              disabled={isExtending || continueAt < minContinueAt}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExtending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('extend.extending') || 'Extending...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('extend.extendButton') || 'Extend Track'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
