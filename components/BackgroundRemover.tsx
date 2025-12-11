'use client'

import { useCallback, useState } from 'react'
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
} from './shared'
import { CREDIT_COSTS } from '@/lib/credits-config'
import { useAnalytics } from '@/hooks/useAnalytics'

interface ProcessingResult {
  id: string
  originalUrl: string
  processedUrl: string
  filename: string
  creditsRemaining: number
}

interface BackgroundRemoverProps {
  userRole?: 'user' | 'premium' | 'admin'
}

export function BackgroundRemover({ userRole = 'user' }: BackgroundRemoverProps) {
  const { data: session } = useSession()
  const t = useTranslations('components.loginPrompt.backgroundRemover')
  const tCommon = useTranslations('common')
  const { trackBackgroundRemoved, trackImageUploaded, trackImageDownloaded } = useAnalytics()
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    // Track upload
    trackImageUploaded(file.size, file.type)
    setProcessing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      toast.loading('Removing background...', { id: 'bg-removal' })

      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process image')
      }

      const data = await response.json()
      setResult(data.image)
      // Track successful background removal
      trackBackgroundRemoved()
      toast.success('Background removed successfully!', { id: 'bg-removal' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage, { id: 'bg-removal' })
    } finally {
      setProcessing(false)
    }
  }, [trackImageUploaded, trackBackgroundRemoved])

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
        title={t('title')}
        description={t('description')}
        callbackUrl="/tools/remove-background"
        accentColor="blue"
        features={["3 Free Credits", "No Credit Card", "Transparent PNG"]}
      />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Upload Area */}
      {!result && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:bg-gray-800/50'
            }
            ${processing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>

            {/* Text */}
            {processing ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tCommon('processingYourImage')}
                </h3>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {tCommon('thisMayTake')}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isDragActive ? tCommon('dropImageHere') : tCommon('dragAndDropImage')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {tCommon('orClickToBrowse')}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                  <span>Supports JPG, PNG, WEBP • Max 10MB •</span>
                  <CreditCostBadge tool="remove_background" size="md" />
                </div>
              </>
            )}
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
            processedUrl={result.processedUrl}
            originalLabel="Original"
            processedLabel="Background Removed"
            accentColor="blue"
          />

          {/* Credits Info */}
          <CreditsInfo
            message="Background removed successfully!"
            creditsRemaining={result.creditsRemaining}
            accentColor="blue"
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ActionButton
              onClick={() => setShowDownloadModal(true)}
              icon="download"
              accentColor="blue"
            >
              Download Image
            </ActionButton>
            <ActionButton
              onClick={() => setResult(null)}
              icon="upload"
              variant="secondary"
              accentColor="gray"
            >
              Process Another
            </ActionButton>
          </div>
        </div>
      )}

      {/* Download Modal */}
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
