'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface GeneratedTrack {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  progress: number;
  errorMessage?: string;
}

// Style tags jak w Suno
const STYLE_PRESETS = [
  { id: 'pop', label: 'Pop', tags: 'pop, catchy, radio-friendly' },
  { id: 'rock', label: 'Rock', tags: 'rock, electric guitar, drums' },
  { id: 'hiphop', label: 'Hip-Hop', tags: 'hip-hop, rap, beats, 808' },
  { id: 'rnb', label: 'R&B', tags: 'r&b, soul, smooth, groovy' },
  { id: 'electronic', label: 'Electronic', tags: 'electronic, synth, edm, dance' },
  { id: 'jazz', label: 'Jazz', tags: 'jazz, saxophone, piano, swing' },
  { id: 'classical', label: 'Classical', tags: 'classical, orchestral, strings, piano' },
  { id: 'country', label: 'Country', tags: 'country, acoustic guitar, folk' },
  { id: 'metal', label: 'Metal', tags: 'metal, heavy, distorted guitar, aggressive' },
  { id: 'ambient', label: 'Ambient', tags: 'ambient, atmospheric, ethereal, soundscape' },
  { id: 'indie', label: 'Indie', tags: 'indie, alternative, lo-fi' },
  { id: 'latin', label: 'Latin', tags: 'latin, reggaeton, tropical, salsa' },
];

const MOOD_TAGS = [
  { id: 'happy', label: 'Happy', tag: 'happy, upbeat, cheerful' },
  { id: 'sad', label: 'Sad', tag: 'sad, melancholic, emotional' },
  { id: 'energetic', label: 'Energetic', tag: 'energetic, powerful, driving' },
  { id: 'calm', label: 'Calm', tag: 'calm, peaceful, relaxing' },
  { id: 'romantic', label: 'Romantic', tag: 'romantic, love, tender' },
  { id: 'dark', label: 'Dark', tag: 'dark, mysterious, intense' },
  { id: 'epic', label: 'Epic', tag: 'epic, cinematic, grand' },
  { id: 'dreamy', label: 'Dreamy', tag: 'dreamy, ethereal, floating' },
];

const VOCAL_STYLES = [
  { id: 'male', label: 'Male Vocal', tag: 'male vocals' },
  { id: 'female', label: 'Female Vocal', tag: 'female vocals' },
  { id: 'duet', label: 'Duet', tag: 'duet, male and female vocals' },
  { id: 'choir', label: 'Choir', tag: 'choir, harmony, group vocals' },
];

const STRUCTURE_TAGS = [
  '[Intro]',
  '[Verse]',
  '[Pre-Chorus]',
  '[Chorus]',
  '[Bridge]',
  '[Outro]',
  '[Instrumental]',
  '[Solo]',
];

// Stała cena za generację (MiniMax generuje ~60s)
const CREDIT_COST = 10;

export default function AIMusicGenerator() {
  const t = useTranslations('aiMusic');
  const { data: session } = useSession();

  // Tryb: 'simple' lub 'custom'
  const [mode, setMode] = useState<'simple' | 'custom'>('simple');

  // Simple mode state
  const [simplePrompt, setSimplePrompt] = useState('');

  // Custom mode state
  const [lyrics, setLyrics] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedVocal, setSelectedVocal] = useState<string>('');
  const [customTags, setCustomTags] = useState('');

  // Common state
  const [title, setTitle] = useState('');
  const [instrumental, setInstrumental] = useState(false);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(null);

  // Ref dla zachowania stanu podczas unmount
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const trackIdRef = useRef<string | null>(null);

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

  // Restore polling on mount if there was an active generation
  useEffect(() => {
    const savedTrackId = sessionStorage.getItem('aiMusicGeneratingId');
    if (savedTrackId && session?.user?.email) {
      trackIdRef.current = savedTrackId;
      setCurrentTrack({
        id: savedTrackId,
        status: 'processing',
        progress: 0,
      });
      setIsGenerating(true);
    }
  }, [session]);

  // Poll for generation status
  useEffect(() => {
    if (!currentTrack || currentTrack.status === 'completed' || currentTrack.status === 'failed') {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      sessionStorage.removeItem('aiMusicGeneratingId');
      return;
    }

    // Save to session storage for persistence
    sessionStorage.setItem('aiMusicGeneratingId', currentTrack.id);
    trackIdRef.current = currentTrack.id;

    pollingRef.current = setInterval(async () => {
      try {
        const trackId = trackIdRef.current;
        if (!trackId) return;

        const res = await fetch(`/api/ai-music/${trackId}/status`);
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
          sessionStorage.removeItem('aiMusicGeneratingId');
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

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [currentTrack?.id, currentTrack?.status]);

  // Build style prompt from selections
  const buildStylePrompt = useCallback(() => {
    const parts: string[] = [];

    if (selectedStyle) {
      const style = STYLE_PRESETS.find(s => s.id === selectedStyle);
      if (style) parts.push(style.tags);
    }

    if (selectedMood) {
      const mood = MOOD_TAGS.find(m => m.id === selectedMood);
      if (mood) parts.push(mood.tag);
    }

    if (selectedVocal && !instrumental) {
      const vocal = VOCAL_STYLES.find(v => v.id === selectedVocal);
      if (vocal) parts.push(vocal.tag);
    }

    if (instrumental) {
      parts.push('instrumental, no vocals');
    }

    if (customTags.trim()) {
      parts.push(customTags.trim());
    }

    return parts.join(', ');
  }, [selectedStyle, selectedMood, selectedVocal, instrumental, customTags]);

  // Handle generation
  const handleGenerate = useCallback(async () => {
    setError(null);

    // Walidacja
    if (mode === 'simple') {
      if (!simplePrompt.trim() || simplePrompt.trim().length < 10) {
        setError(t('errors.promptTooShort'));
        return;
      }
    } else {
      // Custom mode - lyrics required only if NOT instrumental
      if (!instrumental && (!lyrics.trim() || lyrics.trim().length < 10)) {
        setError(t('errors.lyricsRequired'));
        return;
      }
      const style = stylePrompt.trim() || buildStylePrompt();
      if (!style || style.length < 5) {
        setError(t('errors.styleRequired'));
        return;
      }
    }

    if (userCredits < CREDIT_COST) {
      setError(t('errors.insufficientCredits'));
      return;
    }

    setIsGenerating(true);
    setCurrentTrack(null);

    try {
      // Przygotuj dane dla API
      // MiniMax API: prompt = lyrics (tekst piosenki), lyrics_prompt = style (opis muzyczny)
      let apiPrompt: string;
      let apiStylePrompt: string;

      if (mode === 'simple') {
        // Simple mode: AI generuje tekst, użytkownik opisuje co chce
        apiPrompt = simplePrompt.trim();
        apiStylePrompt = simplePrompt.trim();
      } else {
        // Custom mode: użytkownik podaje tekst i styl osobno
        // Dla instrumental bez lyrics, użyj style jako prompt
        apiPrompt = instrumental && !lyrics.trim()
          ? '[Instrumental]'
          : lyrics.trim();
        apiStylePrompt = stylePrompt.trim() || buildStylePrompt();
      }

      const res = await fetch('/api/ai-music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: apiPrompt,
          stylePrompt: apiStylePrompt,
          instrumental,
          title: title.trim() || undefined,
          mode,
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
      setUserCredits(prev => prev - CREDIT_COST);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
      setIsGenerating(false);
    }
  }, [mode, simplePrompt, lyrics, stylePrompt, buildStylePrompt, instrumental, title, userCredits, t]);

  // Insert structure tag into lyrics
  const insertTag = (tag: string) => {
    setLyrics(prev => {
      if (prev.endsWith('\n') || prev === '') {
        return prev + tag + '\n';
      }
      return prev + '\n' + tag + '\n';
    });
  };

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

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [audioElement]);

  if (!session) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎵</div>
        <h3 className="text-xl font-semibold mb-2">{t('signInTitle')}</h3>
        <p className="text-gray-400 mb-6">{t('signInDescription')}</p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
        >
          {t('signIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header with Credits */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t('generator.title')}</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
          <span className="text-gray-400">{t('yourCredits')}:</span>
          <span className="font-semibold text-white">{userCredits}</span>
        </div>
      </div>

      {/* Mode Toggle - Suno style */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setMode('simple')}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            mode === 'simple'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('modes.simple')}
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`px-6 py-2.5 rounded-lg font-medium transition ${
            mode === 'custom'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {t('modes.custom')}
        </button>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left Column - Form (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {mode === 'simple' ? (
            /* Simple Mode */
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('generator.describeLabel')}
              </label>
              <textarea
                value={simplePrompt}
                onChange={(e) => setSimplePrompt(e.target.value)}
                placeholder={t('generator.describePlaceholder')}
                className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-lg"
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-500 mt-2">
                {t('generator.describeHint')}
              </p>
            </div>
          ) : (
            /* Custom Mode */
            <>
              {/* Style Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  {t('generator.styleOfMusic')}
                </label>

                {/* Genre Tags */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">{t('generator.genre')}</p>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_PRESETS.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(selectedStyle === style.id ? '' : style.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                          selectedStyle === style.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                        disabled={isGenerating}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood Tags */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">{t('generator.mood')}</p>
                  <div className="flex flex-wrap gap-2">
                    {MOOD_TAGS.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => setSelectedMood(selectedMood === mood.id ? '' : mood.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                          selectedMood === mood.id
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                        disabled={isGenerating}
                      >
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vocal Style (hidden if instrumental) */}
                {!instrumental && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">{t('generator.vocals')}</p>
                    <div className="flex flex-wrap gap-2">
                      {VOCAL_STYLES.map((vocal) => (
                        <button
                          key={vocal.id}
                          onClick={() => setSelectedVocal(selectedVocal === vocal.id ? '' : vocal.id)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                            selectedVocal === vocal.id
                              ? 'bg-cyan-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                          }`}
                          disabled={isGenerating}
                        >
                          {vocal.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Style Input */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">{t('generator.customStyle')}</p>
                  <input
                    type="text"
                    value={customTags}
                    onChange={(e) => setCustomTags(e.target.value)}
                    placeholder={t('generator.customStylePlaceholder')}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    disabled={isGenerating}
                  />
                </div>

                {/* Or write full style prompt */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">{t('generator.orWriteStyle')}</p>
                  <textarea
                    value={stylePrompt}
                    onChange={(e) => setStylePrompt(e.target.value)}
                    placeholder={t('generator.stylePromptPlaceholder')}
                    className="w-full h-20 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {/* Lyrics Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    {t('generator.lyricsLabel')}
                  </label>
                  <span className="text-xs text-gray-500">{lyrics.length}/3000</span>
                </div>

                {/* Structure Tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {STRUCTURE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => insertTag(tag)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-mono transition"
                      disabled={isGenerating}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value.slice(0, 3000))}
                  placeholder={t('generator.lyricsPlaceholder')}
                  className="w-full h-48 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm"
                  disabled={isGenerating}
                />
                <p className="text-xs text-gray-500 mt-1">{t('generator.lyricsHint')}</p>
              </div>
            </>
          )}

          {/* Common Options */}
          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-700">
            {/* Title */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">{t('generator.titleLabel')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('generator.titlePlaceholder')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                disabled={isGenerating}
              />
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
              <span className="text-sm text-gray-300">{t('generator.instrumental')}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Generate (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Preview Card */}
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-2xl p-6 sticky top-4">
            {/* Generation Progress */}
            {currentTrack && currentTrack.status !== 'completed' && currentTrack.status !== 'failed' && (
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-purple-600/30 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">{t('creating')}</h3>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                  <span>{t('generationInProgress')}</span>
                  <span>{currentTrack.progress}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${Math.max(currentTrack.progress, 5)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">{t('pleaseWait')}</p>
              </div>
            )}

            {/* Completed Track */}
            {currentTrack && currentTrack.status === 'completed' && currentTrack.audioUrl && (
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-center mb-4">{title || t('yourSong')}</h3>

                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={togglePlayback}
                    className="w-14 h-14 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center transition shadow-lg shadow-purple-600/30"
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

                <div className="flex items-center justify-center gap-3">
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
                </div>
              </div>
            )}

            {/* Error */}
            {(error || (currentTrack?.status === 'failed' && currentTrack.errorMessage)) && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm">{error || currentTrack?.errorMessage}</p>
              </div>
            )}

            {/* Default State - Ready to Generate */}
            {!currentTrack && !error && (
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gray-800 flex items-center justify-center">
                  <span className="text-4xl">{instrumental ? '🎹' : '🎤'}</span>
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  {title || (mode === 'simple' ? simplePrompt.slice(0, 30) : lyrics.slice(0, 30)) || t('yourSong')}
                  {(simplePrompt.length > 30 || lyrics.length > 30) && !title ? '...' : ''}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedStyle && STYLE_PRESETS.find(s => s.id === selectedStyle)?.label}
                  {selectedStyle && selectedMood && ' • '}
                  {selectedMood && MOOD_TAGS.find(m => m.id === selectedMood)?.label}
                </p>
              </div>
            )}

            {/* Cost & Generate Button */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm px-2">
                <span className="text-gray-400">{t('cost')}:</span>
                <span className="font-semibold text-white">{CREDIT_COST} {t('credits')}</span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || userCredits < CREDIT_COST}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 ${
                  isGenerating || userCredits < CREDIT_COST
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-600/30'
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

              {userCredits < CREDIT_COST && (
                <p className="text-center text-sm text-gray-400">
                  {t('errors.insufficientCredits')}{' '}
                  <Link href="/pricing" className="text-purple-400 hover:underline">
                    {t('getMoreCredits')}
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Model Info */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-lg">
                🎵
              </div>
              <div>
                <h4 className="font-semibold text-white">Suno AI v4</h4>
                <p className="text-xs text-gray-400">Industry-leading AI music with exceptional vocals</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
              <p>Generates 2 song variations • Up to 4 minutes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
