'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface ProcessedImage {
  id: string
  originalPath: string
  processedPath: string
  originalFilename: string
  createdAt: string
  isProcessed: boolean
}

export function ProcessedImagesGallery() {
  const [images, setImages] = useState<ProcessedImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadImages() {
      try {
        const response = await fetch('/api/processed-images')
        if (response.ok) {
          const data = await response.json()
          setImages(data.images)
        }
      } catch (error) {
        console.error('Failed to load images:', error)
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No processed images yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Upload an image above to remove its background and see it here!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image) => (
        <div
          key={image.id}
          className="group border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 hover:shadow-xl transition-shadow duration-300"
        >
          {/* Image Preview with Checkered Background */}
          <div
            className="relative aspect-square overflow-hidden"
            style={{
              backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          >
            {image.isProcessed && image.processedPath ? (
              <Image
                src={`/api/processed-images/${image.id}/view`}
                alt={image.originalFilename}
                fill
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Processing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Image Info */}
          <div className="p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {image.originalFilename}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(image.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Actions */}
            {image.isProcessed && image.processedPath && (
              <div className="flex gap-2">
                <a
                  href={`/api/processed-images/${image.id}/download`}
                  download
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
                <a
                  href={image.processedPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 rounded-lg transition-colors"
                  title="View Full Size"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
