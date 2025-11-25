'use client'

import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface PackshotResult {
  packshot: string
  preset: string
  dimensions: {
    width: number
    height: number
  }
  creditsRemaining: number
}

interface PackshotGeneratorProps {
  userRole?: 'user' | 'premium' | 'admin'
}

interface Preset {
  id: string
  name: string
  description: string
  icon: string
  credits: number
  disabled?: boolean
}

const PRESETS: Preset[] = [
  {
    id: 'amazon',
    name: 'Amazon Ready',
    description: 'White 2000x2000px + Auto AI Upscale',
    icon: '🎯',
    credits: 1,
  },
  {
    id: 'allegro',
    name: 'Allegro',
    description: 'Light gray 1600x1200px + Auto AI Upscale',
    icon: '🛒',
    credits: 1,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Square 1080x1080px + Auto AI Upscale',
    icon: '📱',
    credits: 1,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Light gray 2048x2048px + Premium AI Upscale',
    icon: '💎',
    credits: 2,
  },
]

export function PackshotGenerator({ userRole = 'user' }: PackshotGeneratorProps) {
  const { data: session } = useSession()
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<PackshotResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('amazon')
  const [originalImage, setOriginalImage] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setError(null)
      setResult(null)

      // Show preview of original image
      const reader = new FileReader()
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      setProcessing(true)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('preset', selectedPreset)

        toast.loading('Generating packshot...', { id: 'packshot' })

        const response = await fetch('/api/generate-packshot', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate packshot')
        }

        const data = await response.json()
        setResult(data)
        toast.success('Packshot generated successfully!', { id: 'packshot' })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast.error(errorMessage, { id: 'packshot' })
      } finally {
        setProcessing(false)
      }
    },
    [selectedPreset]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 30 * 1024 * 1024, // 30MB
    disabled: processing,
  })

  const handleDownload = () => {
    if (!result) return

    const link = document.createElement('a')
    link.href = result.packshot
    link.download = `packshot-${result.preset.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Packshot downloaded!')
  }

  // Show login prompt for unauthenticated users
  if (!session) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="relative border-2 border-dashed border-gray-600 rounded-2xl p-12 bg-gray-800/30">
          <div className="text-center">
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-500"
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
            <h3 className="text-2xl font-bold mb-3">Sign in to Generate Packshots</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start generating professional product packshots with AI. Get 3 free credits!
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/auth/signin?callbackUrl=/tools/packshot-generator"
                className="inline-block px-8 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-medium transition"
              >
                Sign In
              </a>
              <a
                href="/auth/signup"
                className="inline-block px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition"
              >
                Sign Up Free
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Preset Selection */}
      {!result && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-white">Choose Preset</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                disabled={processing || (preset.disabled && userRole === 'user')}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${
                    selectedPreset === preset.id
                      ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }
                  ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${preset.disabled && userRole === 'user' ? 'opacity-50' : ''}
                `}
              >
                <div className="text-3xl mb-2">{preset.icon}</div>
                <h4 className="font-semibold text-white mb-1">{preset.name}</h4>
                <p className="text-xs text-gray-400 mb-2">{preset.description}</p>
                <div className="flex items-center justify-center gap-1 text-xs">
                  <span className="text-green-400">{preset.credits} credit{preset.credits > 1 ? 's' : ''}</span>
                </div>
                {selectedPreset === preset.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {!result && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${
              isDragActive
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 scale-[1.02]'
                : 'border-gray-300 dark:border-gray-700 hover:border-green-400 dark:hover:bg-gray-800/50'
            }
            ${processing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>

            {/* Text */}
            {processing ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Generating packshot...</h3>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">This may take 10-20 seconds</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isDragActive ? 'Drop your product photo here!' : 'Drag & drop your product photo'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">or click to browse</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Supports JPG, PNG, WEBP • Max 30MB • {PRESETS.find(p => p.id === selectedPreset)?.credits || 1}{' '}
                  credit
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && originalImage && (
        <div className="space-y-6">
          {/* Before/After Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Original
              </h4>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Image src={originalImage} alt="Original" fill className="object-contain" />
              </div>
            </div>

            {/* Packshot */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Professional Packshot ({result.preset})
              </h4>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Image src={result.packshot} alt="Packshot" fill className="object-contain" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-300 text-sm">
              ✨ Packshot generated successfully! {result.dimensions.width}x{result.dimensions.height}px • You have{' '}
              <strong>{result.creditsRemaining} credits</strong> remaining.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Packshot
            </button>
            <button
              onClick={() => {
                setResult(null)
                setOriginalImage(null)
              }}
              className="inline-flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Generate Another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
