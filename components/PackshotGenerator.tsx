'use client'

import { useCallback, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { LoginPrompt } from './shared'
import { CREDIT_COSTS } from '@/lib/credits-config'

interface AIBackgroundResult {
  result: string
  prompt: string
  preset: string
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
}

const PRESETS: Preset[] = [
  { id: 'studio', name: 'Studio', description: 'Professional studio lighting', icon: '📸', credits: CREDIT_COSTS.packshot.cost },
  { id: 'marble', name: 'Marble', description: 'Elegant marble surface', icon: '🪨', credits: CREDIT_COSTS.packshot.cost },
  { id: 'nature', name: 'Nature', description: 'Natural outdoor setting', icon: '🌿', credits: CREDIT_COSTS.packshot.cost },
  { id: 'minimal', name: 'Minimal', description: 'Clean gradient background', icon: '◻️', credits: CREDIT_COSTS.packshot.cost },
  { id: 'wood', name: 'Wood', description: 'Rustic wooden surface', icon: '🪵', credits: CREDIT_COSTS.packshot.cost },
  { id: 'lifestyle', name: 'Lifestyle', description: 'Modern interior scene', icon: '🏠', credits: CREDIT_COSTS.packshot.cost },
]

export function PackshotGenerator({ userRole = 'user' }: PackshotGeneratorProps) {
  const { data: session } = useSession()
  const t = useTranslations('components.loginPrompt.packshotGenerator')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<AIBackgroundResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>('studio')
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setSelectedFile(file)
    setError(null)
    setResult(null)

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleGenerate = async () => {
    if (!selectedFile) return

    setProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      if (useCustomPrompt && customPrompt.trim()) {
        formData.append('prompt', customPrompt.trim())
      } else {
        formData.append('preset', selectedPreset)
      }

      toast.loading('Generating AI background...', { id: 'ai-background' })

      const response = await fetch('/api/generate-ai-background', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate background')
      }

      const data = await response.json()
      setResult(data)
      toast.success('AI background generated!', { id: 'ai-background' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      toast.error(errorMessage, { id: 'ai-background' })
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
    maxSize: 30 * 1024 * 1024,
    disabled: processing,
  })

  const handleDownload = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = result.result
    link.download = `ai-background-${result.preset}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Image downloaded!')
  }

  const handleReset = () => {
    setResult(null)
    setOriginalImage(null)
    setSelectedFile(null)
    setError(null)
  }

  if (!session) {
    return (
      <LoginPrompt
        title={t('title')}
        description={t('description')}
        callbackUrl="/tools/packshot-generator"
        accentColor="green"
        features={["3 Free Credits", "No Credit Card", "Professional Quality"]}
      />
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Mode Toggle */}
      {!result && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setUseCustomPrompt(false)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !useCustomPrompt
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Presets
          </button>
          <button
            onClick={() => setUseCustomPrompt(true)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              useCustomPrompt
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Custom Prompt
          </button>
        </div>
      )}

      {/* Preset Selection */}
      {!result && !useCustomPrompt && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Choose Background Style</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id)}
                disabled={processing}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${selectedPreset === preset.id
                    ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="text-2xl mb-2">{preset.icon}</div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{preset.name}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{preset.description}</p>
                {selectedPreset === preset.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
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

      {/* Custom Prompt Input */}
      {!result && useCustomPrompt && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Describe Your Background</h3>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., Professional product photography on elegant marble table with soft studio lighting, luxury feel, high-end commercial photography"
            className="w-full h-32 p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            disabled={processing}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Tip: Be specific about surface, lighting, and style for best results
          </p>
        </div>
      )}

      {/* Upload Area - only show if no image selected */}
      {!result && !originalImage && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragActive
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-700 hover:border-green-400 dark:hover:bg-gray-800/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isDragActive ? 'Drop your product photo here!' : 'Drag & drop your product photo'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">or click to browse</p>
            <p className="text-sm text-gray-500">Supports JPG, PNG, WEBP • Max 30MB • {CREDIT_COSTS.packshot.cost} credit</p>
          </div>
        </div>
      )}

      {/* Image Preview + Generate Button */}
      {!result && originalImage && (
        <div className="space-y-6">
          <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <Image src={originalImage} alt="Preview" fill className="object-contain" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGenerate}
              disabled={processing || (useCustomPrompt && !customPrompt.trim())}
              className={`
                inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg
                transition-all shadow-lg
                ${processing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:shadow-xl'
                }
              `}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate AI Background
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={processing}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Original
              </h4>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Image src={originalImage} alt="Original" fill className="object-contain" />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                AI Background
              </h4>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Image src={result.result} alt="AI Background" fill className="object-contain" />
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-green-800 dark:text-green-300 text-sm">
              ✨ AI background generated successfully! You have <strong>{result.creditsRemaining} credits</strong> remaining.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Image
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Generate Another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
