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
type ImageType = 'product' | 'portrait' | 'general' | 'faithful'

interface ProcessingResult {
  imageId: string
  imageUrl: string
  originalUrl: string
  scale: number
  imageType: ImageType
  model: string
  creditsUsed: number
  creditsRemaining: number
}

// Credit costs based on image type and scale
const CREDIT_COSTS: Record<ImageType, Record<UpscaleScale, number>> = {
  product: { 2: 1, 4: 1, 8: 2 },
  portrait: { 2: 2, 4: 3, 8: 3 },
  general: { 2: 2, 4: 2, 8: 1 },
  faithful: { 2: 1, 4: 1, 8: 1 }, // Sharp Lanczos (local processing, 1 credit)
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
  const [scale, setScale] = useState<UpscaleScale>(4)
  const [imageType, setImageType] = useState<ImageType>('general')

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
      formData.append('imageType', imageType)

      const modelNames: Record<ImageType, string> = {
        product: 'Recraft Crisp',
        portrait: 'CodeFormer + Clarity',
        general: scale === 8 ? 'Real-ESRGAN' : 'Clarity Upscaler',
        faithful: 'Sharp Lanczos (No AI)',
      }

      toast.loading(`${t('processing')} ${scale}x (${modelNames[imageType]})...`, { id: 'upscale' })

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
        imageType: data.imageType,
        model: data.model,
        creditsUsed: data.creditsUsed,
        creditsRemaining: data.creditsRemaining,
      })

      trackImageUpscaled(data.scale, data.model)
      toast.success(t('success'), { id: 'upscale' })
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
      toast.loading(t('preparingDownload'), { id: 'download' })
      const downloadUrl = `/api/processed-images/${result.imageId}/download?type=processed&resolution=original`
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
      toast.success(t('downloadStarted'), { id: 'download' })
    } catch (err) {
      console.error('Download error:', err)
      toast.error(t('downloadFailed'), { id: 'download' })
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
        title={t('loginTitle')}
        description={t('loginDescription')}
        callbackUrl="/tools/upscaler"
        accentColor="purple"
        features={[t('freeCredits'), t('noCard'), t('maxUpscale')]}
      />
    )
  }

  // Credit cost based on current selection
  const creditCost = CREDIT_COSTS[imageType][scale]

  // Image type configurations
  const imageTypes: { type: ImageType; icon: string; label: string; description: string; color: string; isFree?: boolean }[] = [
    {
      type: 'product',
      icon: '📦',
      label: t('typeProduct'),
      description: t('typeProductDesc'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      type: 'portrait',
      icon: '👤',
      label: t('typePortrait'),
      description: t('typePortraitDesc'),
      color: 'from-pink-500 to-rose-500',
    },
    {
      type: 'general',
      icon: '🖼️',
      label: t('typeGeneral'),
      description: t('typeGeneralDesc'),
      color: 'from-purple-500 to-indigo-500',
    },
    {
      type: 'faithful',
      icon: '🔧',
      label: t('typeFaithful'),
      description: t('typeFaithfulDesc'),
      color: 'from-emerald-500 to-teal-500',
    },
  ]

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
              {isDragActive ? t('dropHere') : t('dragDrop')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('orClick')}
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              {t('supportedFormats')}
            </div>
          </div>
        </div>
      )}

      {/* Settings & Preview */}
      {previewUrl && !result && (
        <div className="space-y-8">
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
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

          {/* Image Type Selection */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-center text-gray-900 dark:text-white">
              {t('selectImageType')}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageTypes.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setImageType(item.type)}
                  disabled={processing}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all text-left
                    ${imageType === item.type
                      ? `border-transparent bg-gradient-to-br ${item.color} shadow-lg`
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
                    }
                  `}
                >
                  {/* FREE badge for faithful mode */}
                  {item.isFree && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-sm">
                      FREE
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className={`font-semibold ${imageType === item.type ? 'text-white dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                        {item.label}
                      </div>
                      <div className={`text-xs mt-1 ${imageType === item.type ? 'text-white/80 dark:text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {imageType === item.type && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-white/30 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Scale Selection */}
          <div className="flex flex-col items-center gap-4">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">{t('selectScale')}</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1.5 gap-1">
              {([2, 4, 8] as UpscaleScale[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  disabled={processing}
                  className={`
                    px-8 py-3 rounded-lg text-lg font-bold transition-all
                    ${scale === s
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {s}x
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {scale === 2 && t('scale2xDesc')}
              {scale === 4 && t('scale4xDesc')}
              {scale === 8 && t('scale8xDesc')}
            </p>
          </div>

          {/* Model Info */}
          <div className={`rounded-xl p-4 text-center ${imageType === 'faithful' ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{t('modelUsed')}:</span>{' '}
              {imageType === 'product' && (scale === 8 ? 'Recraft Crisp (2-pass)' : 'Recraft Crisp')}
              {imageType === 'portrait' && (scale <= 2 ? 'CodeFormer' : 'CodeFormer + Clarity')}
              {imageType === 'general' && (scale === 8 ? 'Real-ESRGAN' : 'Clarity Upscaler')}
              {imageType === 'faithful' && 'Sharp Lanczos (No AI)'}
            </p>
            {imageType === 'faithful' && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                {t('faithfulInfo')}
              </p>
            )}
          </div>

          {/* Upscale Button */}
          <div className="flex justify-center">
            <button
              onClick={handleUpscale}
              disabled={processing}
              className={`
                px-10 py-4 rounded-xl font-bold text-lg transition-all
                ${processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl hover:scale-105'
                }
                text-white
              `}
            >
              {processing ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('upscaling')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{t('upscaleButton')} {scale}x</span>
                  {creditCost === 0 ? (
                    <span className="text-emerald-300 text-base font-semibold">(FREE)</span>
                  ) : (
                    <span className="text-purple-200 text-base">({creditCost} {creditCost === 1 ? t('credit') : t('credits')})</span>
                  )}
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
            originalLabel={t('original')}
            processedLabel={`${result.scale}x ${t('upscaled')}`}
            accentColor="purple"
          />

          {/* Credits Info */}
          <CreditsInfo
            message={`${t('successMessage')} (${result.model})`}
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
              {t('downloadImage')}
            </ActionButton>
            <CopyLinkButton imageId={result.imageId} accentColor="purple" />
            <ActionButton
              onClick={handleReset}
              icon="upload"
              variant="secondary"
              accentColor="gray"
            >
              {t('upscaleAnother')}
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUpscaler
