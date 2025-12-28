'use client'

import { useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { LoginPrompt, CopyLinkButton, ActionButton, CreditsInfo } from './shared'
import { calculateProductShotCost, CREDIT_COSTS } from '@/lib/credits-config'
import {
  PRESET_CATEGORIES,
  PRODUCT_SHOT_PRESETS,
  LIGHTING_PRESETS,
  PLACEMENT_OPTIONS,
  getPresetsByCategory,
  type PresetCategory,
  type ProductShotPreset,
  type LightingPreset,
} from '@/lib/product-shot-presets'

interface ProductShotResult {
  id: string
  results: Array<{ index: number; dataUrl: string }>
  prompt: string
  preset: string
  placement: string
  numResults: number
  creditsUsed: number
  creditsRemaining: number
}

interface RelightResult {
  id: string
  results: Array<{ index: number; dataUrl: string; width: number; height: number }>
  prompt: string
  lightDirection: string
  creditsRemaining: number
}

type Mode = 'background' | 'relight'
type Step = 'upload' | 'configure' | 'result'

export function ProductShotPro() {
  const { data: session } = useSession()
  const t = useTranslations('productShotPro')

  // State
  const [mode, setMode] = useState<Mode>('background')
  const [step, setStep] = useState<Step>('upload')
  const [processing, setProcessing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [result, setResult] = useState<ProductShotResult | null>(null)
  const [relightResult, setRelightResult] = useState<RelightResult | null>(null)
  const [selectedResultIndex, setSelectedResultIndex] = useState(0)

  // Background mode options
  const [activeCategory, setActiveCategory] = useState<PresetCategory>('marketplace')
  const [selectedPreset, setSelectedPreset] = useState<ProductShotPreset | null>(
    PRODUCT_SHOT_PRESETS.find(p => p.id === 'pureWhite') || null
  )
  const [customPrompt, setCustomPrompt] = useState('')
  const [useCustomPrompt, setUseCustomPrompt] = useState(false)
  const [numResults, setNumResults] = useState(1)
  const [placement, setPlacement] = useState('automatic')
  const [shotSize, setShotSize] = useState({ width: 1000, height: 1000 })

  // Relight mode options
  const [selectedLightingPreset, setSelectedLightingPreset] = useState<LightingPreset | null>(
    LIGHTING_PRESETS.find(p => p.id === 'studioSoft') || null
  )
  const [lightDirection, setLightDirection] = useState<'None' | 'Left' | 'Right' | 'Top' | 'Bottom'>('None')
  const [enableHrFix, setEnableHrFix] = useState(false)

  // File handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setSelectedFile(file)
    setResult(null)
    setRelightResult(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string)
      setStep('configure')
    }
    reader.readAsDataURL(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 12 * 1024 * 1024,
    disabled: processing,
  })

  // Generate handlers
  const handleGenerateBackground = async () => {
    if (!selectedFile) return

    setProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      if (useCustomPrompt && customPrompt.trim()) {
        formData.append('prompt', customPrompt.trim())
      } else if (selectedPreset) {
        formData.append('preset', selectedPreset.id)
      }

      formData.append('num_results', numResults.toString())
      formData.append('placement', placement)
      formData.append('shot_width', shotSize.width.toString())
      formData.append('shot_height', shotSize.height.toString())

      toast.loading('Generating professional product shot...', { id: 'product-shot' })

      const response = await fetch('/api/product-shot', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate product shot')
      }

      const data = await response.json()
      setResult(data)
      setSelectedResultIndex(0)
      setStep('result')
      toast.success(`Generated ${data.results.length} variant(s)!`, { id: 'product-shot' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      toast.error(errorMessage, { id: 'product-shot' })
    } finally {
      setProcessing(false)
    }
  }

  const handleGenerateRelight = async () => {
    if (!selectedFile) return

    setProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      if (selectedLightingPreset) {
        formData.append('preset', selectedLightingPreset.id)
      }

      formData.append('light_direction', lightDirection)
      formData.append('num_images', numResults.toString())
      formData.append('enable_hr_fix', enableHrFix.toString())

      toast.loading('Applying professional lighting...', { id: 'product-relight' })

      const response = await fetch('/api/product-relight', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to relight product')
      }

      const data = await response.json()
      setRelightResult(data)
      setSelectedResultIndex(0)
      setStep('result')
      toast.success(`Applied lighting to ${data.results.length} variant(s)!`, { id: 'product-relight' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      toast.error(errorMessage, { id: 'product-relight' })
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    const currentResult = mode === 'background' ? result : relightResult
    if (!currentResult) return

    const results = currentResult.results
    const selectedImage = results[selectedResultIndex]
    if (!selectedImage) return

    const link = document.createElement('a')
    link.href = selectedImage.dataUrl
    link.download = `pixelift-product-${mode}-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Image downloaded!')
  }

  const handleDownloadAll = () => {
    const currentResult = mode === 'background' ? result : relightResult
    if (!currentResult) return

    currentResult.results.forEach((img, index) => {
      const link = document.createElement('a')
      link.href = img.dataUrl
      link.download = `pixelift-product-${mode}-${index + 1}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
    toast.success(`Downloaded ${currentResult.results.length} images!`)
  }

  const handleReset = () => {
    setStep('upload')
    setSelectedFile(null)
    setOriginalImage(null)
    setResult(null)
    setRelightResult(null)
    setSelectedResultIndex(0)
  }

  const handleBack = () => {
    if (step === 'result') {
      setStep('configure')
      setResult(null)
      setRelightResult(null)
    } else if (step === 'configure') {
      setStep('upload')
      setSelectedFile(null)
      setOriginalImage(null)
    }
  }

  // Cost calculation
  const estimatedCost = mode === 'background'
    ? calculateProductShotCost(numResults)
    : CREDIT_COSTS.product_shot_relight.cost * numResults

  if (!session) {
    return (
      <LoginPrompt
        title={t('loginTitle')}
        description={t('loginDescription')}
        callbackUrl="/tools/ai-background-generator"
        accentColor="green"
        features={["3 Free Credits", "No Credit Card", "Professional Quality"]}
      />
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Mode Toggle */}
      {step !== 'result' && (
        <div className="flex items-center justify-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setMode('background')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              mode === 'background'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>🎨</span>
              <span>{t('modeBackground')}</span>
            </span>
          </button>
          <button
            onClick={() => setMode('relight')}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
              mode === 'relight'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>💡</span>
              <span>{t('modeRelight')}</span>
            </span>
          </button>
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {step === 'upload' && (
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
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                mode === 'background'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600'
              }`}>
                <span className="text-4xl">{mode === 'background' ? '📦' : '💡'}</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isDragActive ? t('dropHere') : t('uploadTitle')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">{t('uploadSubtitle')}</p>
            <p className="text-sm text-gray-500">
              {t('uploadFormats')} • {t('uploadMaxSize')}
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIGURE */}
      {step === 'configure' && originalImage && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('preview')}</h3>
              <button
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ← {t('changeImage')}
              </button>
            </div>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Image src={originalImage} alt="Preview" fill className="object-contain" />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-6">
            {mode === 'background' ? (
              <>
                {/* Prompt Mode Toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setUseCustomPrompt(false)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      !useCustomPrompt
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t('usePresets')}
                  </button>
                  <button
                    onClick={() => setUseCustomPrompt(true)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      useCustomPrompt
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t('customPrompt')}
                  </button>
                </div>

                {!useCustomPrompt ? (
                  <>
                    {/* Category Tabs */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('selectCategory')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_CATEGORIES.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setActiveCategory(cat.id)
                              const firstPreset = getPresetsByCategory(cat.id)[0]
                              if (firstPreset) setSelectedPreset(firstPreset)
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              activeCategory === cat.id
                                ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg`
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Presets Grid */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('selectPreset')}
                      </label>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                        {getPresetsByCategory(activeCategory).map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setSelectedPreset(preset)}
                            className={`p-3 rounded-lg text-left transition-all ${
                              selectedPreset?.id === preset.id
                                ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 shadow-md'
                                : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span>{preset.icon}</span>
                              <span className="font-medium text-sm text-gray-900 dark:text-white">{preset.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{preset.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Custom Prompt */
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('describeBackground')}
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder={t('customPromptPlaceholder')}
                      className="w-full h-32 p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      disabled={processing}
                    />
                  </div>
                )}

                {/* Placement Options */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('productPlacement')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLACEMENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPlacement(opt.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition ${
                          placement === opt.id
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* RELIGHT MODE */
              <>
                {/* Lighting Presets */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('selectLighting')}
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-2">
                    {LIGHTING_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedLightingPreset(preset)
                          setLightDirection(preset.direction)
                        }}
                        className={`p-3 rounded-lg text-left transition-all ${
                          selectedLightingPreset?.id === preset.id
                            ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-500 shadow-md'
                            : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{preset.icon}</span>
                          <span className="font-medium text-sm text-gray-900 dark:text-white">{preset.name}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Light Direction */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('lightDirection')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['None', 'Left', 'Right', 'Top', 'Bottom'] as const).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => setLightDirection(dir)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          lightDirection === dir
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {dir === 'None' ? '○' : dir === 'Left' ? '←' : dir === 'Right' ? '→' : dir === 'Top' ? '↑' : '↓'} {dir}
                      </button>
                    ))}
                  </div>
                </div>

                {/* HR Fix Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hr-fix"
                    checked={enableHrFix}
                    onChange={(e) => setEnableHrFix(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="hr-fix" className="text-sm text-gray-700 dark:text-gray-300">
                    {t('enableHrFix')}
                  </label>
                </div>
              </>
            )}

            {/* Number of Results */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('numberOfVariants')}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumResults(num)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      numResults === num
                        ? mode === 'background'
                          ? 'bg-green-600 text-white'
                          : 'bg-amber-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost Display */}
            <div className={`p-4 rounded-xl ${
              mode === 'background'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('estimatedCost')}</span>
                <span className={`font-bold ${
                  mode === 'background' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {estimatedCost} {estimatedCost === 1 ? t('credit') : t('credits')}
                </span>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={mode === 'background' ? handleGenerateBackground : handleGenerateRelight}
              disabled={processing || (useCustomPrompt && !customPrompt.trim() && mode === 'background')}
              className={`w-full py-4 rounded-xl font-semibold text-lg text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === 'background'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  {t('generating')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>{mode === 'background' ? '🎨' : '💡'}</span>
                  {mode === 'background' ? t('generateBackground') : t('applyLighting')}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RESULT */}
      {step === 'result' && (result || relightResult) && originalImage && (
        <div className="space-y-6">
          {/* Result Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Original */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                {t('original')}
              </h4>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Image src={originalImage} alt="Original" fill className="object-contain" />
              </div>
            </div>

            {/* Result */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${mode === 'background' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                {mode === 'background' ? t('aiBackground') : t('relitProduct')}
              </h4>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Image
                  src={(result?.results || relightResult?.results)?.[selectedResultIndex]?.dataUrl || ''}
                  alt="Result"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          {/* Variant Selector (if multiple) */}
          {((result?.results.length || 0) > 1 || (relightResult?.results.length || 0) > 1) && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-500">{t('selectVariant')}:</span>
              {(result?.results || relightResult?.results)?.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedResultIndex(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition ${
                    selectedResultIndex === index
                      ? mode === 'background'
                        ? 'bg-green-600 text-white'
                        : 'bg-amber-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}

          {/* Credits Info */}
          <CreditsInfo
            message={t('successMessage')}
            creditsRemaining={result?.creditsRemaining || relightResult?.creditsRemaining || 0}
            accentColor={mode === 'background' ? 'green' : 'amber'}
          />

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <ActionButton
              onClick={handleDownload}
              icon="download"
              accentColor={mode === 'background' ? 'green' : 'amber'}
            >
              {t('downloadSelected')}
            </ActionButton>

            {((result?.results.length || 0) > 1 || (relightResult?.results.length || 0) > 1) && (
              <ActionButton
                onClick={handleDownloadAll}
                icon="download"
                variant="secondary"
                accentColor="gray"
              >
                {t('downloadAll')}
              </ActionButton>
            )}

            {result && <CopyLinkButton imageId={result.id} accentColor={mode === 'background' ? 'green' : 'amber'} />}

            <ActionButton
              onClick={() => setStep('configure')}
              icon="refresh"
              variant="secondary"
              accentColor="gray"
            >
              {t('tryAgain')}
            </ActionButton>

            <ActionButton
              onClick={handleReset}
              icon="upload"
              variant="secondary"
              accentColor="gray"
            >
              {t('newImage')}
            </ActionButton>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductShotPro
