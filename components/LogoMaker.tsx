'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { CreditCostBadge } from './shared';
import { useAnalytics } from '@/hooks/useAnalytics';

const STYLE_PRESETS = [
  { id: 'minimalist', label: 'Minimalist', emoji: '◻️' },
  { id: 'vintage', label: 'Vintage', emoji: '📜' },
  { id: 'modern', label: 'Modern', emoji: '✨' },
  { id: 'playful', label: 'Playful', emoji: '🎨' },
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'tech', label: 'Tech', emoji: '🔧' },
];

export default function LogoMaker() {
  const { data: session } = useSession();
  const { trackImageDownloaded } = useAnalytics();
  const [companyName, setCompanyName] = useState('');
  const [style, setStyle] = useState('modern');
  const [colorScheme, setColorScheme] = useState('');
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!companyName.trim()) {
      setError('Please enter a company or brand name');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedLogo(null);

    try {
      const res = await fetch('/api/logo-maker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          style,
          colorScheme: colorScheme.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate logo');
      }

      setGeneratedLogo(data.generatedLogo);
      setCreditsRemaining(data.creditsRemaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate logo');
    } finally {
      setLoading(false);
    }
  };

  const downloadLogo = () => {
    if (!generatedLogo) return;
    const link = document.createElement('a');
    link.href = generatedLogo;
    link.download = `logo-${companyName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trackImageDownloaded('logo_maker');
  };

  const reset = () => {
    setCompanyName('');
    setStyle('modern');
    setColorScheme('');
    setGeneratedLogo(null);
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
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Sign in to Create Logos</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to generate AI-powered logos. Each generation costs 5 credits.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/auth/signin" className="px-8 py-3 bg-violet-500 hover:bg-violet-600 rounded-lg font-medium transition text-white">Sign In</a>
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
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Logo Details</h3>

        {/* Company Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Company/Brand Name *</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter your company or brand name"
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500"
            maxLength={50}
          />
        </div>

        {/* Style Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Style</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {STYLE_PRESETS.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  style === s.id
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Scheme */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Color Scheme (optional)</label>
          <input
            type="text"
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value)}
            placeholder="e.g., blue and gold, vibrant colors, monochrome"
            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !companyName.trim()}
            className="px-6 py-3 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-600 rounded-lg font-medium transition text-white flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              'Generate Logo'
            )}
          </button>
          <CreditCostBadge tool="logo_maker" size="md" />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Result */}
      {generatedLogo && (
        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Logo</h3>
            {creditsRemaining !== null && (
              <span className="text-sm text-gray-500">{creditsRemaining} credits remaining</span>
            )}
          </div>
          <div className="rounded-lg overflow-hidden bg-white dark:bg-gray-900 p-8 mb-4 flex items-center justify-center">
            <img src={generatedLogo} alt="Generated Logo" className="max-w-full max-h-96 object-contain" />
          </div>
          <div className="flex gap-4">
            <button
              onClick={downloadLogo}
              className="flex-1 px-6 py-3 bg-violet-500 hover:bg-violet-600 rounded-lg font-medium transition text-white"
            >
              Download Logo
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
              New Logo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
