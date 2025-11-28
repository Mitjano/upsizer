"use client";

import { FaInfoCircle } from "react-icons/fa";
import ImageComparison from "../ImageComparison";
import { ImageInfo } from "./types";

interface ImagePreviewProps {
  previewUrl: string | null;
  upscaledUrl: string | null;
  imageInfo: ImageInfo | null;
  scale: number;
  processing: boolean;
  progress: string;
}

/**
 * Image preview with comparison slider
 */
export default function ImagePreview({
  previewUrl,
  upscaledUrl,
  imageInfo,
  scale,
  processing,
  progress
}: ImagePreviewProps) {
  return (
    <>
      {/* Image Info */}
      {imageInfo && (
        <div className="flex items-center gap-4 text-sm text-gray-400 bg-gray-800/30 rounded-lg p-3">
          <FaInfoCircle className="text-blue-400" />
          <span>
            {imageInfo.width} × {imageInfo.height} px
          </span>
          <span>•</span>
          <span>{(imageInfo.size / 1024 / 1024).toFixed(2)} MB</span>
          <span>•</span>
          <span>Output: {imageInfo.width * scale} × {imageInfo.height * scale} px</span>
        </div>
      )}

      {/* Comparison or Preview */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        {upscaledUrl && previewUrl ? (
          <ImageComparison
            beforeImage={previewUrl}
            afterImage={upscaledUrl}
            beforeLabel={`Original (${imageInfo?.width}×${imageInfo?.height})`}
            afterLabel={`${scale}x Enhanced`}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Original Image
              </h3>
              <img
                src={previewUrl || undefined}
                alt="Original"
                className="w-full rounded-lg border border-gray-600"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                AI Enhanced Preview
              </h3>
              <div className="w-full aspect-square bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
                {processing ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">{progress}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Click &quot;Process Image&quot; to upscale</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
