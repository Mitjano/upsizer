'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
}

interface SpeedOption {
  value: number;
  label: string;
}

interface VoiceoverConfig {
  voices: Voice[];
  speeds: SpeedOption[];
  limits: {
    minLength: number;
    maxLength: number;
  };
  pricing: {
    baseCost: number;
    perThousandChars: number;
    description: string;
  };
}

interface GeneratedVoiceover {
  audioUrl: string;
  duration: number;
  metadata: {
    text: string;
    textLength: number;
    voiceId: string;
    voiceName: string;
    language: string;
    speed: number;
    creditsUsed: number;
    remainingCredits: number;
  };
}

export default function VoiceoverGenerator() {
  const t = useTranslations('aiVideo.voiceover');
  const { data: session } = useSession();

  const [config, setConfig] = useState<VoiceoverConfig | null>(null);
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('Calm_Woman');
  const [speed, setSpeed] = useState(1.0);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVoiceover, setGeneratedVoiceover] = useState<GeneratedVoiceover | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch available options
  useEffect(() => {
    fetch('/api/ai-video/voiceover')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        // Set default voice based on first available
        if (data.voices?.length > 0) {
          setVoiceId(data.voices[0].id);
          setSelectedLanguage(data.voices[0].language);
        }
      })
      .catch(err => console.error('Failed to load config:', err));
  }, []);

  // Filter voices by selected language
  const filteredVoices = config?.voices.filter(v => v.language === selectedLanguage) || [];

  // Get unique languages
  const languages = config?.voices
    ? [...new Set(config.voices.map(v => v.language))]
    : [];

  // Calculate cost based on text length
  const calculateCost = () => {
    if (!config) return 0;
    const baseCost = config.pricing.baseCost;
    const additionalCost = Math.floor(text.length / 1000);
    return baseCost + additionalCost;
  };

  const handleGenerate = async () => {
    if (!text.trim() || text.length < 10) {
      setError(t('errors.textRequired'));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVoiceover(null);

    try {
      const response = await fetch('/api/ai-video/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceId,
          speed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate voiceover');
      }

      setGeneratedVoiceover(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = async () => {
    if (generatedVoiceover?.audioUrl) {
      const response = await fetch(generatedVoiceover.audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voiceover-${Date.now()}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      en: 'English',
      pl: 'Polski',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
    };
    return names[code] || code;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Generator Form */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span>🎙️</span>
          {t('title')}
        </h2>

        {/* Text Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('textLabel')} *
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('textPlaceholder')}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition resize-none"
            rows={6}
            maxLength={5000}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{t('minChars')}: 10</span>
            <span>{text.length}/5000</span>
          </div>
        </div>

        {/* Language Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('languageLabel')}
          </label>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setSelectedLanguage(lang);
                  // Set first voice of this language
                  const firstVoice = config?.voices.find(v => v.language === lang);
                  if (firstVoice) setVoiceId(firstVoice.id);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedLanguage === lang
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {getLanguageName(lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('voiceLabel')}
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {filteredVoices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setVoiceId(voice.id)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                  voiceId === voice.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{voice.gender === 'male' ? '👨' : '👩'}</span>
                {voice.name}
              </button>
            ))}
          </div>
        </div>

        {/* Speed Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('speedLabel')}
          </label>
          <div className="flex flex-wrap gap-2">
            {config?.speeds.map((s) => (
              <button
                key={s.value}
                onClick={() => setSpeed(s.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  speed === s.value
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cost Preview */}
        <div className="mb-6 p-4 bg-gray-900/50 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">{t('estimatedCost')}:</span>
            <span className="text-xl font-bold text-cyan-400">
              {calculateCost()} {t('credits')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {config?.pricing.description}
          </p>
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
            disabled={isGenerating || text.trim().length < 10}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <span>🎙️</span>
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

      {/* Generated Voiceover Result */}
      {generatedVoiceover && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔊</span>
              {t('resultTitle')}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlay}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium text-white transition flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <span>⏸️</span>
                    {t('pause')}
                  </>
                ) : (
                  <>
                    <span>▶️</span>
                    {t('play')}
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-white transition flex items-center gap-2"
              >
                <span>⬇️</span>
                {t('download')}
              </button>
            </div>
          </div>

          {/* Audio Player */}
          <audio
            ref={audioRef}
            src={generatedVoiceover.audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="w-full mb-4"
            controls
          />

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded-full text-xs">
              {generatedVoiceover.metadata.voiceName}
            </span>
            <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs">
              {generatedVoiceover.metadata.speed}x {t('speed')}
            </span>
            <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs">
              {generatedVoiceover.metadata.textLength} {t('characters')}
            </span>
            {generatedVoiceover.duration && (
              <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-xs">
                {Math.round(generatedVoiceover.duration)}s
              </span>
            )}
          </div>

          {/* Text Preview */}
          <div className="bg-gray-900 rounded-xl p-4">
            <p className="text-gray-400 text-sm italic">
              "{generatedVoiceover.metadata.text}"
            </p>
          </div>

          {/* Credits Info */}
          <div className="mt-4 text-sm text-gray-500 text-right">
            {t('creditsUsed')}: {generatedVoiceover.metadata.creditsUsed} | {t('remaining')}: {generatedVoiceover.metadata.remainingCredits}
          </div>
        </div>
      )}
    </div>
  );
}
