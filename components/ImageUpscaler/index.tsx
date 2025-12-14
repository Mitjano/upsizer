'use client'

import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast'
import Image from 'next/image'
import {
  LoginPrompt,
  ImageComparison,
  CreditsInfo,
  ErrorMessage,
  ActionButton,
  CopyLinkButton,
} from '../shared'
import { useAnalytics } from '@/hooks/useAnalytics'

type UpscaleScale = 2 | 4 | 8

interface ProcessingResult {
  imageId: string
  imageUrl: string
  originalUrl: string
  scale: number
  model: string
  faceEnhance: boolean
  creditsUsed: number
  creditsRemaining: number
}

interface ImageUpscalerProps {
  userRole?: 'user' | 'premium' | 'admin'
}

export function ImageUpscaler({ userRole = 'user' }: ImageUpscalerProps) {
  const { data: session } = useSession()
  const t = useTranslations('components.imageUpscaler')
  const tCommon = useTranslations('common')
  const { trackImageUpscaled, trackImageUploaded, trackImageDownloaded } = useAnalytics()

  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Settings
  const [scale, setScale] = useState<UpscaleScale>(2)
  const [faceEnhance, setFaceEnhance] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    trackImageUploaded(file.size, file.type)
    setSelectedFile(file)
    setError(null)
    setResult(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [trackImageUploaded])

  const handleUpscale = async () => {
    if (!selectedFile) return

    setProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('scale', scale.toString())
      formData.append('faceEnhance', faceEnhance.toString())

      const modelName = faceEnhance ? 'GFPGAN (Face Enhancement)' : 'Real-ESRGAN'
      toast.loading(`Upscaling ${scale}x with ${modelName}...`, { id: 'upscale' })

      const response = await fetch('/api/upscale', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to upscale image')
      }

      const data = await response.json()

      setResult({
        imageId: data.imageId,
        imageUrl: data.imageUrl,
        originalUrl: data.originalUrl || previewUrl!,
        scale: data.scale,
        model: data.model,
        faceEnhance: data.faceEnhance,
        creditsUsed: data.creditsUsed,
        creditsRemaining: data.creditsRemaining,
      })

      trackImageUpscaled(data.scale, data.model)
      toast.success('Image upscaled successfully!', { id: 'upscale' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage, { id: 'upscale' })
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (!result?.imageId) return

    try {
      toast.loading('Preparing download...', { id: 'download' })
      // Use the download endpoint with proper filename
      const downloadUrl = `/api/processed-images/${result.imageId}/download?type=processed`
      const response = await fetch(downloadUrl)

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `upscaled_${result.scale}x_${selectedFile?.name?.replace(/\.[^.]+$/, '.png') || 'image.png'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      trackImageDownloaded('upscale')
      toast.success('Download started!', { id: 'download' })
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to download image', { id: 'download' })
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError(null)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: processing
  })

  // Show login prompt for unauthenticated users
  if (!session) {
    return (
      <LoginPrompt
        title="Upscale Your Images"
        description="Sign in to upscale your images up to 8x with AI"
        callbackUrl="/tools/upscaler"
        accentColor="purple"
        features={["3 Free Credits", "No Credit Card", "Up to 8x Upscale"]}
      />
    )
  }

  // Credit cost: 1 base + 1 for face enhancement
  const creditCost = 1 + (faceEnhance ? 1 : 0)

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Upload Area - Only show when no file selected */}
      {!previewUrl && !result && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragActive
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-700 hover:border-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Text */}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isDragActive ? 'Drop image here' : 'Drag & drop your image'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              or click to browse
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Supports JPG, PNG, WEBP - Max 10MB
            </div>
          </div>
        </div>
      )}

      {/* Settings & Preview */}
      {previewUrl && !result && (
        <div className="space-y-6">
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            {/* Using unoptimized for preview URLs from FileReader */}
            <Image
              src={previewUrl}
              alt="Preview"
              width={800}
              height={400}
              className="w-full max-h-[400px] object-contain"
              unoptimized
            />
            <button
              onClick={handleReset}
              className="absolute top-4 right-4 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scale Selection */}
          <div className="flex flex-col items-center gap-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upscale Factor:</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {[2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s as UpscaleScale)}
                  disabled={processing}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                    scale === s
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Face Enhancement Toggle */}
          <div className="flex items-center justify-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={faceEnhance}
                  onChange={(e) => setFaceEnhance(e.target.checked)}
                  disabled={processing}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  faceEnhance
                    ? 'bg-purple-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    faceEnhance ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Face Enhancement (GFPGAN)
              </span>
              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
                +1 credit
              </span>
            </label>
          </div>

          {/* Info */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {faceEnhance
              ? 'GFPGAN enhances faces and improves overall quality'
              : 'Real-ESRGAN for fast, reliable upscaling'}
          </div>

          {/* Upscale Button */}
          <div className="flex justify-center">
            <button
              onClick={handleUpscale}
              disabled={processing}
              className={`
                px-8 py-4 rounded-xl font-semibold text-lg transition-all
                ${processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                }
                text-white
              `}
            >
              {processing ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Upscaling...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Upscale {scale}x</span>
                  <span className="text-purple-200">({creditCost} credit{creditCost > 1 ? 's' : ''})</span>
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          {/* Before/After Comparison */}
          <ImageComparison
            originalUrl={result.originalUrl}
            processedUrl={result.imageUrl}
            originalLabel="Original"
            processedLabel={`${result.scale}x Upscaled${result.faceEnhance ? ' + Enhanced' : ''}`}
            accentColor="purple"
          />

          {/* Credits Info */}
          <CreditsInfo
            message={`Image upscaled ${result.scale}x successfully!${result.faceEnhance ? ' Face enhancement applied.' : ''}`}
            creditsRemaining={result.creditsRemaining}
            accentColor="purple"
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ActionButton
              onClick={handleDownload}
              icon="download"
              accentColor="purple"
            >
              Download Image
            </ActionButton>
            <CopyLinkButton imageId={result.imageId} accentColor="purple" />
            <ActionButton
              onClick={handleReset}
              icon="upload"
              variant="secondary"
              accentColor="gray"
            >
              Upscale Another
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpscaler
