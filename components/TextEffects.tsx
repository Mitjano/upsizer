'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { CreditCostBadge } from './shared';
import { useAnalytics } from '@/hooks/useAnalytics';

const TEXT_STYLES = [
  { id: '3d', label: '3D', emoji: '🎲' },
  { id: 'neon', label: 'Neon', emoji: '💡' },
  { id: 'graffiti', label: 'Graffiti', emoji: '🎨' },
  { id: 'fire', label: 'Fire', emoji: '🔥' },
  { id: 'ice', label: 'Ice', emoji: '❄️' },
  { id: 'gold', label: 'Gold', emoji: '🥇' },
  { id: 'chrome', label: 'Chrome', emoji: '🔧' },
  { id: 'cartoon', label: 'Cartoon', emoji: '🎭' },
  { id: 'retro', label: 'Retro', emoji: '📼' },
  { id: 'glitch', label: 'Glitch', emoji: '📟' },
];

const BACKGROUND_OPTIONS = [
  { id: 'transparent', label: 'Transparent' },
  { id: 'solid', label: 'Solid Color' },
  { id: 'gradient', label: 'Gradient' },
];

export default function TextEffects() {
  const { data: session } = useSession();
  const { trackImageDownloaded } = useAnalytics();
  const [text, setText] = useState('');
  const [style, setStyle] = useState('neon');
  const [background, setBackground] = useState('transparent');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    if (text.length > 100) {
      setError('Text must be 100 characters or less');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const res = await fetch('/api/text-effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          style,
          background,
          backgroundColor: background !== 'transparent' ? backgroundColor : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate text effect');
      }

      setGeneratedImage(data.generatedImage);
      setCreditsRemaining(data.creditsRemaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate text effect');
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `text-effect-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trackImageDownloaded('text_effects');
  };

  const reset = () => {
    setText('');
    setStyle('neon');
    setBackground('transparent');
    setGeneratedImage(null);
    setError(null);
  };

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 bg-gray-100 dark:bg-gray-800/30">
          <div className="text-center">
            <div className="mb-6">
              <svg className="mx-auto h-16 w-16 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Sign in to Create Text Effects</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to generate stylized text art. Each generation costs 5 credits.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/auth/signin" className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition text-white">Sign In</a>
              <a href="/auth/signup" className="px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white">Sign Up Free</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input Section */}
      <div className="mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create Text Effect</h3>

        {/* Text Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Your Text *</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text (max 100 characters)"
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 text-xl"
            maxLength={100}
          />
          <div className="text-right text-sm text-gray-500 mt-1">{text.length}/100</div>
        </div>

        {/* Style Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Effect Style</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TEXT_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`px-3 py-3 rounded-lg font-medium transition flex flex-col items-center gap-1 ${
                  style === s.id
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-sm">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Background Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Background</label>
          <div className="flex gap-3 mb-3">
            {BACKGROUND_OPTIONS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setBackground(bg.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  background === bg.id
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {bg.label}
              </button>
            ))}
          </div>
          {background !== 'transparent' && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-400">Background Color:</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 rounded-lg font-medium transition text-white flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              'Generate Text Effect'
            )}
          </button>
          <CreditCostBadge tool="text_effects" size="md" />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Result */}
      {generatedImage && (
        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Text Effect</h3>
            {creditsRemaining !== null && (
              <span className="text-sm text-gray-500">{creditsRemaining} credits remaining</span>
            )}
          </div>
          <div className="rounded-lg overflow-hidden bg-gray-900 p-4 mb-4">
            <img src={generatedImage} alt="Generated Text Effect" className="w-full h-auto" />
          </div>
          <div className="flex gap-4">
            <button
              onClick={downloadImage}
              className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-medium transition text-white"
            >
              Download Image
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
            >
              Regenerate
            </button>
            <button
              onClick={reset}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
            >
              New Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
