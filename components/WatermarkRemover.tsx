'use client'

import { useCallback, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import { useTranslations } from 'next-intl'
import toast from 'react-hot-toast'
import { DownloadOptionsModal } from './DownloadOptionsModal'
import {
  LoginPrompt,
  ImageComparison,
  CreditsInfo,
  ErrorMessage,
  ActionButton,
  CreditCostBadge,
  CopyLinkButton,
} from './shared'
import { useAnalytics } from '@/hooks/useAnalytics'

interface ProcessingResult {
  id: string
  originalUrl: string
  processedUrl: string
  filename: string
  creditsRemaining: number
}

interface WatermarkRemoverProps {
  userRole?: 'user' | 'premium' | 'admin'
}

export function WatermarkRemover({ userRole = 'user' }: WatermarkRemoverProps) {
  const { data: session } = useSession()
  const t = useTranslations('watermarkRemover')
  const tCommon = useTranslations('common')
  const { trackImageUploaded, trackImageDownloaded } = useAnalytics()
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [maskMode, setMaskMode] = useState<'auto' | 'manual'>('auto')
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(30)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    trackImageUploaded(file.size, file.type)
    setUploadedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
    setResult(null)
    setMaskDataUrl(null)
  }, [trackImageUploaded])

  const initCanvas = useCallback(() => {
    if (!canvasRef.current || !previewUrl) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    img.src = previewUrl
  }, [previewUrl])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (maskMode !== 'manual') return
    setIsDrawing(true)
    draw(e)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || maskMode !== 'manual') return
    draw(e)
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    if (canvasRef.current) {
      setMaskDataUrl(canvasRef.current.toDataURL('image/png'))
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(x, y, brushSize * scaleX, 0, Math.PI * 2)
    ctx.fill()
  }

  const clearMask = () => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setMaskDataUrl(null)
  }

  const processImage = async () => {
    if (!uploadedFile) return

    setProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      if (maskMode === 'manual' && maskDataUrl) {
        // Convert mask data URL to blob without using fetch (CSP-safe)
        const base64Data = maskDataUrl.split(',')[1]
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes], { type: 'image/png' })
        formData.append('mask', blob, 'mask.png')
      }

      toast.loading(t('processing'), { id: 'watermark-remover' })

      const res = await fetch('/api/watermark-remover', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to process image')
      }

      const data = await res.json()
      setResult(data.image)
      toast.success(t('success'), { id: 'watermark-remover' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage, { id: 'watermark-remover' })
    } finally {
      setProcessing(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    disabled: processing
  })

  const reset = () => {
    setResult(null)
    setUploadedFile(null)
    setPreviewUrl(null)
    setError(null)
    setMaskDataUrl(null)
  }

  // Show login prompt for unauthenticated users
  if (!session) {
    return (
      <LoginPrompt
        title={t('auth.title')}
        description={t('auth.description')}
        callbackUrl="/tools/watermark-remover"
        accentColor="orange"
        features={[t('auth.feature1'), t('auth.feature2'), t('auth.feature3')]}
      />
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Upload Area */}
      {!uploadedFile && !result && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragActive
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-700 hover:border-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }
            ${processing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isDragActive ? tCommon('dropImageHere') : t('upload.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('upload.subtitle')}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-500">
              <span>{t('upload.formats')}</span>
              <CreditCostBadge tool="watermark_remover" size="md" />
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {uploadedFile && !result && (
        <div className="space-y-6">
          {/* Preview with optional mask drawing */}
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('preview.title')}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => { setMaskMode('auto'); setMaskDataUrl(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    maskMode === 'auto'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t('settings.autoDetect')}
                </button>
                <button
                  onClick={() => { setMaskMode('manual'); initCanvas(); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    maskMode === 'manual'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t('settings.manualMask')}
                </button>
              </div>
            </div>

            <div className="relative flex justify-center">
              <img
                src={previewUrl!}
                alt="Preview"
                className={`max-h-96 rounded-lg object-contain ${maskMode === 'manual' ? 'opacity-50' : ''}`}
              />
              {maskMode === 'manual' && (
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="absolute top-0 left-0 w-full h-full cursor-crosshair opacity-50"
                  style={{ maxHeight: '24rem', objectFit: 'contain' }}
                />
              )}
            </div>

            {maskMode === 'manual' && (
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    {t('settings.brushSize')}: {brushSize}px
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>
                <button
                  onClick={clearMask}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
                >
                  {t('settings.clearMask')}
                </button>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-4">
              {maskMode === 'auto' ? t('settings.autoDescription') : t('settings.manualDescription')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ActionButton
              onClick={processImage}
              icon="lightning"
              accentColor="purple"
              disabled={processing}
            >
              {processing ? t('buttons.processing') : t('buttons.remove')}
            </ActionButton>
            <ActionButton
              onClick={reset}
              icon="upload"
              variant="secondary"
              accentColor="gray"
              disabled={processing}
            >
              {t('buttons.changeImage')}
            </ActionButton>
          </div>

          {processing && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Result */}
      {result && (
        <div className="space-y-6">
          <ImageComparison
            originalUrl={result.originalUrl}
            processedUrl={result.processedUrl}
            originalLabel={t('result.before')}
            processedLabel={t('result.after')}
            accentColor="purple"
          />

          <CreditsInfo
            message={t('result.success')}
            creditsRemaining={result.creditsRemaining}
            accentColor="purple"
          />

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ActionButton
              onClick={() => setShowDownloadModal(true)}
              icon="download"
              accentColor="purple"
            >
              {t('buttons.download')}
            </ActionButton>
            <CopyLinkButton imageId={result.id} accentColor="purple" />
            <ActionButton
              onClick={reset}
              icon="upload"
              variant="secondary"
              accentColor="gray"
            >
              {t('buttons.processAnother')}
            </ActionButton>
          </div>
        </div>
      )}

      {result && showDownloadModal && (
        <DownloadOptionsModal
          imageId={result.id}
          originalFilename={result.filename}
          userRole={userRole}
          onClose={() => setShowDownloadModal(false)}
        />
      )}
    </div>
  )
}
