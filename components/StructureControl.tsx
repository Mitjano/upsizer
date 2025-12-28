"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import ImageComparison from "./ImageComparison";
import { FaTimes, FaInfoCircle, FaLayerGroup, FaRuler, FaBorderAll } from "react-icons/fa";
import { CreditCostBadge, CopyLinkButton, ActionButton } from './shared';
import { CREDIT_COSTS } from '@/lib/credits-config';

export default function StructureControl() {
  const { data: session } = useSession();
  const t = useTranslations('structureControl');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [imageInfo, setImageInfo] = useState<{width: number, height: number, size: number} | null>(null);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [controlMode, setControlMode] = useState('depth');
  const [prompt, setPrompt] = useState("");
  const [strength, setStrength] = useState(0.8);
  const [imageId, setImageId] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert(t('errors.invalidFile'));
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert(t('errors.fileTooLarge'));
      return;
    }

    setSelectedFile(file);
    setProcessedUrl(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        setImageInfo({
          width: img.width,
          height: img.height,
          size: file.size,
        });
      };
      img.src = reader.result as string;
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!selectedFile || !prompt.trim()) {
      alert(t('errors.noPrompt'));
      return;
    }

    setProcessing(true);
    setProgress(t('progress.uploading'));
    setProcessedUrl(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("prompt", prompt);
      formData.append("control_mode", controlMode);
      formData.append("strength", strength.toString());

      const modeName = controlMode === 'depth' ? 'Depth' : 'Canny';
      setProgress(t('progress.processing', { mode: modeName }));

      const response = await fetch("/api/structure-control", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process image");
      }

      const data = await response.json();

      if (data.success && data.processedImage) {
        setProgress(t('progress.complete'));
        setProcessedUrl(data.processedImage);
        setCreditsRemaining(data.creditsRemaining);
        if (data.id) {
          setImageId(data.id);
        }
      } else {
        throw new Error("No processed image in response");
      }

    } catch (error: unknown) {
      console.error("Structure control error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`${t('errors.processFailed')}: ${errorMessage}`);
      setProgress("");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!processedUrl) return;

    try {
      const link = document.createElement("a");
      link.href = processedUrl;
      link.download = `pixelift_${controlMode}_${selectedFile?.name || "image.png"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
      alert(t('errors.downloadFailed'));
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessedUrl(null);
    setProgress("");
    setImageInfo(null);
    setPrompt("");
    setImageId(null);
  };

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-12 bg-gray-100 dark:bg-gray-800/30">
          <div className="text-center">
            <div className="mb-6">
              <FaRuler className="mx-auto h-16 w-16 text-gray-500 dark:text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">{t('loginTitle')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t('loginDescription')}
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/auth/signin" className="inline-block px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg font-medium transition">
                {t('signIn')}
              </a>
              <a href="/auth/signup" className="inline-block px-8 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition">
                {t('signUpFree')}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {!previewUrl ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-12 transition-all ${
            dragActive ? "border-amber-500 bg-amber-500/10" : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleChange}
          />

          <div className="text-center">
            <div className="mb-4">
              <FaRuler className="mx-auto h-12 w-12 text-amber-600 dark:text-amber-400" />
            </div>

            <label htmlFor="file-upload" className="cursor-pointer inline-block px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg font-medium transition mb-4">
              {t('uploadButton')}
            </label>

            <p className="text-gray-600 dark:text-gray-400 mt-4">{t('dropHint')}</p>
            <div className="mt-6 text-sm text-gray-500 dark:text-gray-500">
              <p className="mb-2">{t('supportedFormats')}</p>
              <p>{t('maxFileSize')}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={handleReset} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500 transition">
              <FaTimes className="text-red-500" />
            </button>
          </div>

          {imageInfo && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/30 rounded-lg p-3">
              <FaInfoCircle className="text-amber-600 dark:text-amber-400" />
              <span>{imageInfo.width} x {imageInfo.height} px</span>
              <span>-</span>
              <span>{(imageInfo.size / 1024 / 1024).toFixed(2)} MB</span>
              {creditsRemaining !== null && (
                <>
                  <span>-</span>
                  <span className="text-amber-600 dark:text-amber-400">{creditsRemaining} {t('creditsRemaining')}</span>
                </>
              )}
            </div>
          )}

          {/* Control Mode Selection */}
          {!processedUrl && (
            <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('controlMode')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {(['depth', 'canny'] as const).map((modeId) => {
                  const icons = {
                    depth: <FaLayerGroup className="text-2xl" />,
                    canny: <FaBorderAll className="text-2xl" />
                  };
                  return (
                    <button
                      key={modeId}
                      onClick={() => setControlMode(modeId)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        controlMode === modeId
                          ? 'border-amber-500 bg-amber-500/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-100 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className={controlMode === modeId ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}>
                          {icons[modeId]}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">{t(`modes.${modeId}.name`)}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t(`modes.${modeId}.description`)}</p>
                      <div className="flex flex-wrap gap-1">
                        {(t.raw(`modes.${modeId}.examples`) as string[]).map((ex: string, i: number) => (
                          <span key={i} className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Prompt */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {t('promptLabel')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('promptPlaceholder')}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:border-amber-500 focus:outline-none resize-none text-gray-900 dark:text-white"
                  rows={3}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {(t.raw('promptSuggestions') as string[]).map((suggestion: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(prompt ? `${prompt}, ${suggestion}` : suggestion)}
                      className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full transition"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Strength */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {t('strengthLabel')}: {(strength * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={strength}
                  onChange={(e) => setStrength(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-1">
                  <span>{t('moreCreative')}</span>
                  <span>{t('strictStructure')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Preview / Results */}
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            {processedUrl && previewUrl ? (
              <ImageComparison
                beforeImage={previewUrl}
                afterImage={processedUrl}
                beforeLabel={t('referenceImage')}
                afterLabel={`${t('generatedPreview')} (${t(`modes.${controlMode}.name`)})`}
              />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{t('referenceImage')}</h3>
                  <img src={previewUrl || undefined} alt={t('referenceImage')} className="w-full rounded-lg border border-gray-300 dark:border-gray-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{t('generatedPreview')}</h3>
                  <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    {processing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">{progress}</p>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <p className="text-gray-500 dark:text-gray-500">{t('previewHint')}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-600 mt-2">
                          {t('previewDescription')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {!processedUrl ? (
              <button
                onClick={handleProcess}
                disabled={processing || !prompt.trim()}
                className="px-12 py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-xl transition shadow-xl shadow-amber-500/30"
              >
                {processing ? t('generating') : t('generateButton')}
              </button>
            ) : (
              <>
                <ActionButton
                  onClick={handleDownload}
                  variant="primary"
                  accentColor="purple"
                  icon="download"
                >
                  {t('downloadResult')}
                </ActionButton>
                {imageId && <CopyLinkButton imageId={imageId} />}
                <ActionButton
                  onClick={() => setProcessedUrl(null)}
                  disabled={processing}
                  variant="secondary"
                  accentColor="blue"
                >
                  {t('tryDifferent')}
                </ActionButton>
              </>
            )}
            <button
              onClick={handleReset}
              disabled={processing}
              className="px-6 py-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg font-semibold transition text-gray-900 dark:text-white"
            >
              {t('uploadNew')}
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-500 flex items-center justify-center gap-2">
            <span>{t('poweredBy')} {controlMode === 'depth' ? t('depthPro') : t('cannyPro')} -</span>
            <CreditCostBadge tool="structure_control" size="xs" />
            <span>{t('perGeneration')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
