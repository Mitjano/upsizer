'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface DownloadDropdownProps {
  trackId: string;
  trackTitle: string;
  onError: (message: string) => void;
}

export default function DownloadDropdown({ trackId, trackTitle, onError }: DownloadDropdownProps) {
  const t = useTranslations('aiMusic');
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (format: 'mp3' | 'wav' | 'flac') => {
    setIsDownloading(format);

    try {
      let response: Response;
      let filename: string;
      let contentType: string;

      if (format === 'mp3') {
        response = await fetch(`/api/ai-music/${trackId}/download`);
        filename = `${trackTitle || 'song'}.mp3`;
        contentType = 'audio/mpeg';
      } else {
        response = await fetch(`/api/ai-music/${trackId}/convert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format }),
        });
        filename = `${trackTitle || 'song'}.${format}`;
        contentType = format === 'wav' ? 'audio/wav' : 'audio/flac';
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsOpen(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-700 rounded-lg transition flex items-center gap-1"
        title={t('player.download') || 'Download'}
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* MP3 - Free */}
          <button
            onClick={() => handleDownload('mp3')}
            disabled={!!isDownloading}
            className="w-full px-4 py-2 text-left hover:bg-gray-700 transition flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <div className="font-medium text-white">MP3</div>
              <div className="text-xs text-gray-400">Standard quality</div>
            </div>
            {isDownloading === 'mp3' ? (
              <svg className="w-4 h-4 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-xs text-green-400">Free</span>
            )}
          </button>

          <div className="border-t border-gray-700" />

          {/* WAV */}
          <button
            onClick={() => handleDownload('wav')}
            disabled={!!isDownloading}
            className="w-full px-4 py-2 text-left hover:bg-gray-700 transition flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <div className="font-medium text-white">WAV</div>
              <div className="text-xs text-gray-400">16-bit Lossless</div>
            </div>
            {isDownloading === 'wav' ? (
              <svg className="w-4 h-4 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-xs text-purple-400">2 credits</span>
            )}
          </button>

          {/* FLAC */}
          <button
            onClick={() => handleDownload('flac')}
            disabled={!!isDownloading}
            className="w-full px-4 py-2 text-left hover:bg-gray-700 transition flex items-center justify-between disabled:opacity-50"
          >
            <div>
              <div className="font-medium text-white">FLAC</div>
              <div className="text-xs text-gray-400">24-bit High Quality</div>
            </div>
            {isDownloading === 'flac' ? (
              <svg className="w-4 h-4 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <span className="text-xs text-purple-400">3 credits</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
