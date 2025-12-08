'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  MUSIC_MODELS,
  type MusicModelId,
  type MusicStyle,
  type MusicMood,
  type MusicDuration,
  calculateMusicCost,
} from '@/lib/ai-music/models';

interface GeneratedTrack {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  progress: number;
  errorMessage?: string;
}

const STYLES: MusicStyle[] = [
  'pop', 'rock', 'hiphop', 'rnb', 'jazz', 'electronic',
  'classical', 'country', 'folk', 'metal', 'reggae', 'blues', 'latin', 'indie'
];

const MOODS: MusicMood[] = [
  'happy', 'sad', 'energetic', 'calm', 'romantic', 'melancholic',
  'uplifting', 'dark', 'dreamy', 'aggressive', 'nostalgic', 'epic'
];

const DURATIONS: MusicDuration[] = [60, 120, 180, 240, 300];

export default function AIMusicGenerator() {
  const t = useTranslations('aiMusic');
  const { data: session } = useSession();

  // Form state
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState<MusicStyle>('pop');
  const [mood, setMood] = useState<MusicMood>('happy');
  const [duration, setDuration] = useState<MusicDuration>(120);
  const [instrumental, setInstrumental] = useState(false);
  const [title, setTitle] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [bpm, setBpm] = useState<number | undefined>();
  const [musicalKey, setMusicalKey] = useState<string>('');

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);

  const model: MusicModelId = 'minimax-music-2.0';
  const creditCost = calculateMusicCost(model, duration);

  // Fetch user credits
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/user/credits')
        .then(res => res.json())
        .then(data => {
          if (data.credits !== undefined) {
            setUserCredits(data.credits);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  // Poll for generation status
  useEffect(() => {
    if (!currentTrack || currentTrack.status === 'completed' || currentTrack.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai-music/${currentTrack.id}/status`);
        const data = await res.json();

        setCurrentTrack(prev => prev ? {
          ...prev,
          status: data.status,
          progress: data.progress || prev.progress,
          audioUrl: data.audioUrl,
          errorMessage: data.errorMessage,
        } : null);

        if (data.status === 'completed' || data.status === 'failed') {
          setIsGenerating(false);
          if (data.status === 'completed') {
            // Refresh credits
            const creditsRes = await fetch('/api/user/credits');
            const creditsData = await creditsRes.json();
            if (creditsData.credits !== undefined) {
              setUserCredits(creditsData.credits);
            }
          }
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentTrack]);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError(t('errors.promptRequired'));
      return;
    }

    if (prompt.trim().length < 10) {
      setError(t('errors.promptTooShort'));
      return;
    }

    if (userCredits < creditCost) {
      setError(t('errors.insufficientCredits'));
      return;
    }

    setError(null);
    setIsGenerating(true);
    setCurrentTrack(null);

    try {
      const res = await fetch('/api/ai-music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          lyrics: !instrumental ? lyrics.trim() : undefined,
          style,
          mood,
          duration,
          instrumental,
          bpm,
          key: musicalKey,
          title: title.trim() || undefined,
          model,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setCurrentTrack({
        id: data.musicId,
        status: 'processing',
        progress: 0,
      });

      // Deduct credits locally for immediate feedback
      setUserCredits(prev => prev - creditCost);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setIsGenerating(false);
    }
  }, [prompt, lyrics, style, mood, duration, instrumental, bpm, musicalKey, title, model, creditCost, userCredits, t]);

  // Handle audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const togglePlayback = useCallback(() => {
    if (!currentTrack?.audioUrl) return;

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      const audio = new Audio(currentTrack.audioUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  }, [currentTrack, audioElement, isPlaying]);

  if (!session) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎵</div>
        <h3 className="text-xl font-semibold mb-2">Sign in to Create Music</h3>
        <p className="text-gray-400 mb-6">Create an account to start generating AI music</p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
        >
          Sign In to Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('generator.title')}</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
          <span className="text-gray-400">{t('yourCredits')}:</span>
          <span className="font-semibold text-white">{userCredits}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('generator.promptLabel')} *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('generator.promptPlaceholder')}
              className="w-full h-24 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('generator.titleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('generator.titlePlaceholder')}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isGenerating}
            />
          </div>

          {/* Lyrics (hidden if instrumental) */}
          {!instrumental && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('generator.lyricsLabel')}
              </label>
              <textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                placeholder={t('generator.lyricsPlaceholder')}
                className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-500 mt-1">{t('generator.lyricsHint')}</p>
            </div>
          )}

          {/* Style & Mood */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('generator.styleLabel')}
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as MusicStyle)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isGenerating}
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>{t(`styles.${s}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('generator.moodLabel')}
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as MusicMood)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isGenerating}
              >
                {MOODS.map((m) => (
                  <option key={m} value={m}>{t(`moods.${m}`)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('generator.durationLabel')}
            </label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    duration === d
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  disabled={isGenerating}
                >
                  {t(`durations.${d}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Instrumental Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setInstrumental(!instrumental)}
              className={`relative w-12 h-6 rounded-full transition ${
                instrumental ? 'bg-purple-600' : 'bg-gray-700'
              }`}
              disabled={isGenerating}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                  instrumental ? 'left-7' : 'left-1'
                }`}
              />
            </button>
            <div>
              <span className="text-sm font-medium text-gray-300">{t('generator.instrumentalLabel')}</span>
              <p className="text-xs text-gray-500">{t('generator.instrumentalHint')}</p>
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
            >
              <svg
                className={`w-4 h-4 transition ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {t('generator.advancedOptions')}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-800/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('generator.bpmLabel')}
                  </label>
                  <input
                    type="number"
                    min={60}
                    max={200}
                    value={bpm || ''}
                    onChange={(e) => setBpm(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="60-200"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    disabled={isGenerating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('generator.keyLabel')}
                  </label>
                  <select
                    value={musicalKey}
                    onChange={(e) => setMusicalKey(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500"
                    disabled={isGenerating}
                  >
                    <option value="">Auto</option>
                    {['C', 'Cm', 'D', 'Dm', 'E', 'Em', 'F', 'Fm', 'G', 'Gm', 'A', 'Am', 'B', 'Bm'].map((k) => (
                      <option key={k} value={k}>{t(`keys.${k}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Preview & Generate */}
        <div className="space-y-6">
          {/* Preview Card */}
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">
                {instrumental ? '🎹' : '🎤'}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {title || prompt.slice(0, 30) || 'Your Song'}
                {prompt.length > 30 && !title ? '...' : ''}
              </h3>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <span>{t(`styles.${style}`)}</span>
                <span>•</span>
                <span>{t(`moods.${mood}`)}</span>
                <span>•</span>
                <span>{t(`durations.${duration}`)}</span>
              </div>
            </div>

            {/* Generation Progress */}
            {currentTrack && currentTrack.status !== 'completed' && currentTrack.status !== 'failed' && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                  <span>{t('generationInProgress')}</span>
                  <span>{currentTrack.progress}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${currentTrack.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">{t('pleaseWait')}</p>
              </div>
            )}

            {/* Completed Track */}
            {currentTrack && currentTrack.status === 'completed' && currentTrack.audioUrl && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={togglePlayback}
                    className="w-14 h-14 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition"
                  >
                    {isPlaying ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <a
                    href={currentTrack.audioUrl}
                    download
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('player.download')}
                  </a>
                  <Link
                    href={`/ai-music/${currentTrack.id}`}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition flex items-center gap-2"
                  >
                    {t('mastering.master')}
                  </Link>
                </div>
              </div>
            )}

            {/* Error */}
            {(error || (currentTrack?.status === 'failed' && currentTrack.errorMessage)) && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{error || currentTrack?.errorMessage}</p>
              </div>
            )}

            {/* Cost & Generate Button */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{t('cost')}:</span>
                <span className="font-semibold text-white">{creditCost} {t('credits')}</span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || userCredits < creditCost}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 ${
                  isGenerating || userCredits < creditCost
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('generating')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    {t('generate')}
                  </>
                )}
              </button>

              {userCredits < creditCost && (
                <p className="text-center text-sm text-gray-400">
                  {t('errors.insufficientCredits')}{' '}
                  <Link href="/pricing" className="text-purple-400 hover:underline">
                    Get more credits
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Model Info */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                🎵
              </div>
              <div>
                <h4 className="font-semibold text-white">{MUSIC_MODELS[model].name}</h4>
                <p className="text-xs text-gray-400">{MUSIC_MODELS[model].provider}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-3">{MUSIC_MODELS[model].description}</p>
            <div className="flex flex-wrap gap-2">
              {MUSIC_MODELS[model].features.slice(0, 3).map((feature, idx) => (
                <span key={idx} className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
