'use client'

import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface ExpandResult {
  expandedImage: string
  expandMode: string
  dimensions: {
    width: number
    height: number
  }
  creditsUsed: number
  creditsRemaining: number
}

interface ImageExpanderProps {
  userRole?: 'user' | 'premium' | 'admin'
}

interface ExpandPreset {
  id: string
  name: string
  description: string
  icon: string
  credits: number
}

const EXPAND_PRESETS: ExpandPreset[] = [
  {
    id: 'zoom_1.5x',
    name: 'Zoom Out 1.5x',
    description: 'Expand canvas by 50%',
    icon: '🔍',
    credits: 2,
  },
  {
    id: 'zoom_2x',
    name: 'Zoom Out 2x',
    description: 'Double the canvas size',
    icon: '🔎',
    credits: 2,
  },
  {
    id: 'make_square',
    name: 'Make Square',
    description: 'Convert to square format',
    icon: '⬜',
    credits: 2,
  },
  {
    id: 'expand_horizontal',
    name: 'Expand Left & Right',
    description: 'Extend both sides',
    icon: '↔️',
    credits: 4,
  },
  {
    id: 'expand_left',
    name: 'Expand Left',
    description: 'Extend image to the left',
    icon: '⬅️',
    credits: 2,
  },
  {
    id: 'expand_right',
    name: 'Expand Right',
    description: 'Extend image to the right',
    icon: '➡️',
    credits: 2,
  },
  {
    id: 'expand_up',
    name: 'Expand Up',
    description: 'Extend image upward',
    icon: '⬆️',
    credits: 2,
  },
  {
    id: 'expand_down',
    name: 'Expand Down',
    description: 'Extend image downward',
    icon: '⬇️',
    credits: 2,
  },
]

export function ImageExpander({ userRole = 'user' }: ImageExpanderProps) {
  const { data: session } = useSession()
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ExpandResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('zoom_1.5x')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [prompt, setPrompt] = useState<string>('')

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
        formData.append('expandMode', selectedPreset)
        if (prompt.trim()) {
          formData.append('prompt', prompt.trim())
        }

        toast.loading('Expanding image...', { id: 'expand' })

        const response = await fetch('/api/expand-image', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to expand image')
        }

        const data = await response.json()
        setResult(data)
        toast.success('Image expanded successfully!', { id: 'expand' })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        toast.error(errorMessage, { id: 'expand' })
      } finally {
        setProcessing(false)
      }
    },
    [selectedPreset, prompt]
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
    link.href = result.expandedImage
    link.download = `expanded-${result.expandMode}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Image downloaded!')
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
            <h3 className="text-2xl font-bold mb-3">Sign in to Expand Images</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Create a free account to start expanding your images with AI. Get 3 free credits!
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/auth/signin?callbackUrl=/tools/image-expand"
                className="inline-block px-8 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition"
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
          <h3 className="text-xl font-semibold mb-4 text-white">Choose Expand Mode</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {EXPAND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                disabled={processing}
                className={`
                  relative p-4 rounded-xl border-2 transition-all text-left
                  ${
                    selectedPreset === preset.id
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }
                  ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="text-2xl mb-2">{preset.icon}</div>
                <h4 className="font-semibold text-white text-sm mb-1">{preset.name}</h4>
                <p className="text-xs text-gray-400">{preset.description}</p>
                <p className="text-xs text-purple-400 mt-1">{preset.credits} credits</p>
                {selectedPreset === preset.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optional Prompt */}
      {!result && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Custom Prompt (optional)
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Continue with blue sky and green grass..."
            disabled={processing}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition disabled:opacity-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe what should be generated in the expanded areas
          </p>
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
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-[1.02]'
                : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 dark:hover:bg-gray-800/50'
            }
            ${processing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </div>
            </div>

            {/* Text */}
            {processing ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Expanding image...</h3>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">This may take 10-20 seconds</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isDragActive ? 'Drop your image here!' : 'Drag & drop your image'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">or click to browse</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Supports JPG, PNG, WEBP • Max 30MB • {EXPAND_PRESETS.find(p => p.id === selectedPreset)?.credits || 2} credits
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
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Image src={originalImage} alt="Original" fill className="object-contain" />
              </div>
            </div>

            {/* Expanded */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Expanded ({EXPAND_PRESETS.find(p => p.id === result.expandMode)?.name})
              </h4>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Image src={result.expandedImage} alt="Expanded" fill className="object-contain" />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-purple-800 dark:text-purple-300 text-sm">
              ✨ Image expanded successfully! {result.dimensions.width}x{result.dimensions.height}px • You have{' '}
              <strong>{result.creditsRemaining} credits</strong> remaining.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Expanded Image
            </button>
            <button
              onClick={() => {
                setResult(null)
                setOriginalImage(null)
                setPrompt('')
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
              Expand Another Image
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
