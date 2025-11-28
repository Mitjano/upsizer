'use client'

import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import toast from 'react-hot-toast'
import {
  LoginPrompt,
  ImageComparison,
  CreditsInfo,
  ErrorMessage,
  ActionButton,
} from './shared'

interface ExpandResult {
  expandedImage: string
  expandMode: string
  dimensions: {
    width: number
    height: number
  }
  seed: number
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
    description: 'Extend both sides at once',
    icon: '↔️',
    credits: 2,
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
  const [selectedPreset, setSelectedPreset] = useState<string>('expand_horizontal')
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lastSeed, setLastSeed] = useState<number | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setError(null)
      setResult(null)
      setSelectedFile(file)

      // Show preview of original image
      const reader = new FileReader()
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    },
    []
  )

  const handleExpand = async (useSeed?: number) => {
    if (!selectedFile) return

    setProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('expandMode', selectedPreset)
      if (useSeed !== undefined) {
        formData.append('seed', useSeed.toString())
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
      setLastSeed(data.seed)
      toast.success('Image expanded successfully!', { id: 'expand' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage, { id: 'expand' })
    } finally {
      setProcessing(false)
    }
  }

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
      <LoginPrompt
        title="Sign in to Expand Images"
        description="Create a free account to start expanding your images with AI. Get 3 free credits!"
        callbackUrl="/tools/image-expand"
        accentColor="purple"
        features={["3 Free Credits", "No Credit Card", "AI Outpainting"]}
      />
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Preset Selection - show when no result yet */}
      {!result && !processing && (
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

      {/* Upload Area - only show if no image selected and no result */}
      {!result && !originalImage && (
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
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isDragActive ? 'Drop your image here!' : 'Drag & drop your image'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">or click to browse</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Supports JPG, PNG, WEBP • Max 30MB • {EXPAND_PRESETS.find(p => p.id === selectedPreset)?.credits || 2} credits
            </p>
          </div>
        </div>
      )}

      {/* Image Preview with Expand Button - show after image selected but before result */}
      {!result && originalImage && (
        <div className="space-y-6">
          {/* Image Preview */}
          <div className="relative">
            <div className="relative aspect-video max-h-[400px] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Image src={originalImage} alt="Selected image" fill className="object-contain" />
            </div>
            {/* Change Image Button */}
            <button
              onClick={() => {
                setOriginalImage(null)
                setSelectedFile(null)
              }}
              disabled={processing}
              className="absolute top-3 right-3 bg-gray-900/70 hover:bg-gray-900/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              Change Image
            </button>
          </div>

          {/* Expand Button */}
          <div className="flex justify-center">
            <button
              onClick={() => handleExpand()}
              disabled={processing}
              className={`
                inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all
                ${processing
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:scale-[1.02]'
                }
                text-white
              `}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Expanding... (10-20 sec)
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  Expand Image ({EXPAND_PRESETS.find(p => p.id === selectedPreset)?.credits || 2} credits)
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Result */}
      {result && originalImage && (
        <div className="space-y-6">
          {/* Before/After Comparison */}
          <ImageComparison
            originalUrl={originalImage}
            processedUrl={result.expandedImage}
            originalLabel="Original"
            processedLabel={`Expanded (${EXPAND_PRESETS.find(p => p.id === result.expandMode)?.name})`}
            accentColor="purple"
            aspectRatio="video"
          />

          {/* Info */}
          <CreditsInfo
            message={`Image expanded successfully! ${result.dimensions.width}x${result.dimensions.height}px.`}
            creditsRemaining={result.creditsRemaining}
            extraInfo={result.seed ? `Seed: ${result.seed}` : undefined}
            accentColor="purple"
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <ActionButton
              onClick={handleDownload}
              icon="download"
              accentColor="purple"
            >
              Download
            </ActionButton>
            <ActionButton
              onClick={() => {
                setResult(null)
                handleExpand(lastSeed || undefined)
              }}
              disabled={processing}
              icon="refresh"
              accentColor="purple"
              variant="secondary"
            >
              Same Result (2 cr)
            </ActionButton>
            <ActionButton
              onClick={() => {
                setResult(null)
                handleExpand()
              }}
              disabled={processing}
              icon="lightning"
              accentColor="green"
            >
              Try Different (2 cr)
            </ActionButton>
            <ActionButton
              onClick={() => {
                setResult(null)
                setOriginalImage(null)
                setSelectedFile(null)
                setLastSeed(null)
              }}
              icon="upload"
              variant="secondary"
              accentColor="gray"
            >
              New Image
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  )
}
