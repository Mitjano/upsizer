'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { CreditCostBadge } from './shared';
import { useAnalytics } from '@/hooks/useAnalytics';

interface QRCodeResult {
  success: boolean;
  qrCode: string; // base64 data URL
}

export default function QRGenerator() {
  const { data: session } = useSession();
  const { track } = useAnalytics();
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  // QR Code settings
  const [content, setContent] = useState('');
  const [size, setSize] = useState(400);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [margin, setMargin] = useState(4);
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#FFFFFF');
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Logo must be a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file size must be less than 5MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoFile(result);
      setLogoPreview(result);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read logo file');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please enter content for the QR code');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress('Generating QR code...');

    try {
      const requestBody: {
        content: string;
        size: number;
        errorCorrectionLevel: string;
        margin: number;
        darkColor: string;
        lightColor: string;
        logo?: string;
      } = {
        content: content.trim(),
        size,
        errorCorrectionLevel,
        margin,
        darkColor,
        lightColor,
      };

      // Add logo if provided
      if (logoFile) {
        requestBody.logo = logoFile;
      }

      const res = await fetch('/api/qr-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Handle non-JSON responses (like HTML error pages)
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server error. Please try again.');
      }

      const data: QRCodeResult = await res.json();

      if (!res.ok) {
        throw new Error((data as any).error || 'Failed to generate QR code');
      }

      setQrCodeImage(data.qrCode);
      track('qr_generator');
      setProgress('');

    } catch (err) {
      console.error('QR generation error:', err);
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate QR code');
      }
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeImage) return;

    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `qr-code-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setQrCodeImage(null);
    setContent('');
    setSize(400);
    setErrorCorrectionLevel('M');
    setMargin(4);
    setDarkColor('#000000');
    setLightColor('#FFFFFF');
    setLogoFile(null);
    setLogoPreview(null);
    setError(null);
    setProgress('');
  };

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
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Sign in to Generate QR Codes</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start generating QR codes. Get 3 free credits to try it out!
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/auth/signin"
                className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Sign In
              </a>
              <a
                href="/auth/signup"
                className="inline-block px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Sign Up Free
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div>
        {/* Settings Panel */}
        <div className="mb-6 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">QR Code Settings</h3>
            <CreditCostBadge tool="qr_generator" size="md" />
          </div>

          <div className="space-y-6">
            {/* Content Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Content (URL or Text) *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://example.com or any text"
                className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white resize-none"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Size Slider */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Size: {size}px
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>100px</span>
                  <span>1000px</span>
                </div>
              </div>

              {/* Error Correction Level */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Error Correction Level
                </label>
                <select
                  value={errorCorrectionLevel}
                  onChange={(e) => setErrorCorrectionLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white"
                  disabled={loading}
                >
                  <option value="L">Low (7% recovery)</option>
                  <option value="M">Medium (15% recovery)</option>
                  <option value="Q">Quartile (25% recovery)</option>
                  <option value="H">High (30% recovery)</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Margin Slider */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Margin: {margin}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={margin}
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>

              {/* Dark Color Picker */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Dark Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    className="h-10 w-16 rounded cursor-pointer"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Light Color Picker */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Light Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={lightColor}
                    onChange={(e) => setLightColor(e.target.value)}
                    className="h-10 w-16 rounded cursor-pointer"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    value={lightColor}
                    onChange={(e) => setLightColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                Logo (Optional)
              </label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleLogoSelect}
                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-green-500 file:text-gray-900 dark:file:text-white hover:file:bg-green-600"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    JPG, PNG, WebP up to 5MB
                  </p>
                </div>
                {logoPreview && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
              {logoFile && (
                <button
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                  }}
                  className="mt-2 text-sm text-red-400 hover:text-red-300"
                  disabled={loading}
                >
                  Remove Logo
                </button>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleGenerate}
                disabled={loading || !content.trim()}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                {loading ? 'Generating...' : 'Generate QR Code'}
              </button>
              <button
                onClick={reset}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
            <p className="text-blue-400">{progress}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* QR Code Result */}
        {qrCodeImage && (
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Generated QR Code</h3>
            <div className="flex flex-col items-center">
              <div className="relative rounded-lg overflow-hidden bg-white dark:bg-white p-8 mb-6">
                <img
                  src={qrCodeImage}
                  alt="Generated QR Code"
                  className="w-full h-full object-contain"
                  style={{ maxWidth: `${size}px`, maxHeight: `${size}px` }}
                />
              </div>
              <button
                onClick={downloadQRCode}
                className="w-full max-w-md px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition text-gray-900 dark:text-white"
              >
                Download QR Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
